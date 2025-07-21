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

		var websites []models.ContentWebsite
		var serializedWebsites *[]byte

		if game.Websites != nil {
			websites = make([]models.ContentWebsite, len(*game.Websites))

			for _, website := range *game.Websites {
				if !website.Trusted {
					continue
				}

				websites = append(websites, models.ContentWebsite{
					Trusted: website.Trusted,
					URL:     website.URL,
					Type:    website.Type.Type,
				})
			}

			if len(websites) > 0 {
				json, err := json.Marshal(websites)
				if err != nil {
					return fmt.Errorf("error marshalling websites: %w", err)
				}
				serializedWebsites = &json
			}
		}

		var releaseDate *time.Time
		// for _, rd := range game.ReleaseDates {
		// 	releaseDate = &rd.Date
		// }
		if game.FirstReleaseDate != nil && *game.FirstReleaseDate > 0 {
			date := time.Unix(*game.FirstReleaseDate, 0)
			releaseDate = &date
		}

		var sourceUrl *string
		if game.URL != nil {
			sourceUrl = game.URL
		}

		var coverKey *string
		if game.Cover != nil && game.Cover.ImageID != nil {
			coverKey = game.Cover.ImageID
		}

		id, err := qtx.UpsertGame(ctx, db.UpsertGameParams{
			ExternalID:   game.ID,
			ReleaseDate:  releaseDate,
			Websites:     serializedWebsites,
			CoverKey:     coverKey,
			CoverKeyType: db.NullImageKeyType{ImageKeyType: db.ImageKeyTypeIgdb, Valid: true},
			SourceUrl:    sourceUrl,
			SourceType:   db.ContentSourceIgdb,
		})
		if err != nil {
			return fmt.Errorf("error upserting game: %w", err)
		}

		err = qtx.UpsertGameLocalization(ctx, db.UpsertGameLocalizationParams{
			ContentID: id,
			Lang:      "en",
			Title:     game.Name,
		})
		if err != nil {
			return fmt.Errorf("error upserting game localization: %w", err)
		}

		names := make(map[string]string)
		for _, locale := range utils.AllowedLocales {
			names[locale] = game.Name
		}

		if game.AlternativeNames != nil {
			for _, altName := range *game.AlternativeNames {
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
		}

		documents[i%batchSize] = &storage.BulkIndexRequest{
			ID: id.String(),
			Doc: &models.BasicElasticContent{
				ImageKey:     coverKey,
				ImageKeyType: db.ImageKeyTypeIgdb,
				EnglishName:  names["en"],
				RussianName:  names["ru"],
				GermanName:   names["de"],
				SpanishName:  names["es"],
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
