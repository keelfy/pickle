package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type IGDBSyncService interface {
	SyncGames(ctx context.Context) error
	TriggerGamesSync(w http.ResponseWriter, r *http.Request)
}

type igdbSyncService struct {
	sqlDB      storage.RelationalStorage
	elastic    storage.ElasticStorage
	igdbClient clients.IGDBClient
}

func NewIGDBSyncService(sqlDB storage.RelationalStorage, elastic storage.ElasticStorage, igdbClient clients.IGDBClient) IGDBSyncService {
	return &igdbSyncService{
		sqlDB:      sqlDB,
		elastic:    elastic,
		igdbClient: igdbClient,
	}
}

func (s *igdbSyncService) TriggerGamesSync(w http.ResponseWriter, r *http.Request) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Hour)
		defer cancel()

		err := s.SyncGames(ctx)
		if err != nil {
			logger.Errorf(ctx, "[IGDB Sync] Sync failed: %v", err)
		}
	}()
	w.WriteHeader(http.StatusNoContent)
}

func (s *igdbSyncService) SyncGames(ctx context.Context) error {
	syncLog, err := s.sqlDB.Queries().CreateIGDBSync(ctx, "incremental")
	if err != nil {
		return err
	}
	logger.Infof(ctx, "[IGDB Sync] Sync started: %v", syncLog.ID)

	var gamesProcessed int64

	defer func() {
		if err != nil {
			s.sqlDB.Queries().CompleteIGDBSyncWithError(ctx, db.CompleteIGDBSyncWithErrorParams{
				ID:           syncLog.ID,
				ErrorMessage: err.Error(),
			})
			logger.Errorf(ctx, "[IGDB Sync] Sync failed: %v", err)
		} else {
			s.sqlDB.Queries().CompleteIGDBSync(ctx, db.CompleteIGDBSyncParams{
				ID:             syncLog.ID,
				GamesProcessed: gamesProcessed,
			})
			logger.Infof(ctx, "[IGDB Sync] Sync completed: %v", syncLog.ID)
		}
	}()

	// Get last successful sync timestamp
	lastSync, err := s.sqlDB.Queries().GetLastSuccessfulSync(ctx, "incremental")
	if err != nil {
		return err
	}
	logger.Debugf(ctx, "[IGDB Sync] Last successful sync: %v", lastSync.CompletedAt)

	// Fetch games from IGDB
	games, err := s.igdbClient.GetUpdatedGames(ctx, lastSync.CompletedAt)
	if err != nil {
		return err
	}
	logger.Debugf(ctx, "[IGDB Sync] Fetched %d games", len(games))

	gamesProcessed = int64(len(games))

	var batchSize = 100

	// Begin transaction
	tx, err := s.sqlDB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.sqlDB.Queries().WithTx(tx)

	documents := make([]*storage.BulkIndexRequest, batchSize)

	for i, game := range games {
		if i > 0 && i%batchSize == 0 { // avoid holding locks for too long
			err = s.elastic.BulkIndexDocuments(ctx, "igdb_games", documents)
			if err != nil {
				return err
			}

			documents = make([]*storage.BulkIndexRequest, batchSize)

			err = tx.Commit(ctx)
			if err != nil {
				return err
			}
			logger.Debugf(ctx, "[IGDB Sync] Committed %d/%d games", i, len(games))

			tx, err = s.sqlDB.Begin(ctx)
			if err != nil {
				return err
			}
			qtx = s.sqlDB.Queries().WithTx(tx)
		}

		websites, err := json.Marshal(game.Websites)
		if err != nil {
			return fmt.Errorf("error marshalling websites: %w", err)
		}

		id, err := qtx.UpsertGame(ctx, db.UpsertGameParams{
			IgdbID:      game.ID,
			ReleaseDate: time.Unix(game.ReleaseDate, 0),
			Websites:    websites,
		})
		if err != nil {
			return fmt.Errorf("error upserting game: %w", err)
		}

		err = qtx.UpsertGameLocalization(ctx, db.UpsertGameLocalizationParams{
			GameID: id,
			Lang:   "en",
			Title:  game.Name,
		})
		if err != nil {
			return fmt.Errorf("error upserting game localization: %w", err)
		}

		names := make(map[string]string)
		for _, locale := range utils.AllowedLocales {
			names[locale] = game.Name
		}

		for _, altName := range game.AlternativeNames {
			comment := strings.ToLower(altName.Comment)
			if strings.Contains(comment, "russian") {
				names["ru"] = altName.Name
			} else if strings.Contains(comment, "german") {
				names["de"] = altName.Name
			} else if strings.Contains(comment, "spanish") {
				names["es"] = altName.Name
			} else if strings.Contains(comment, "english") {
				names["en"] = altName.Name
			}
		}

		documents[i%batchSize] = &storage.BulkIndexRequest{
			ID: id.String(),
			Doc: &models.ElasticIGDBGame{
				EnglishName: names["en"],
				RussianName: names["ru"],
				GermanName:  names["de"],
				SpanishName: names["es"],
			},
		}
	}

	tx.Commit(ctx)

	// Refresh materialized views
	if err = s.sqlDB.Queries().RefreshLocalizedGameViews(ctx); err != nil {
		return err
	}

	return nil
}
