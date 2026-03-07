package services

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/mapper"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type IGDBSyncService interface {
	SyncGames(ctx context.Context, syncType domain.SyncType) error
	TriggerGamesSync(w http.ResponseWriter, r *http.Request)
}

type igdbSyncService struct {
	sqlDB      storage.RelationalStorage
	elastic    storage.ElasticStorage
	igdbClient clients.IGDBClient
	logger     *zap.SugaredLogger
}

func NewIGDBSyncService(sqlDB storage.RelationalStorage, elastic storage.ElasticStorage, igdbClient clients.IGDBClient, zapLogger *zap.SugaredLogger) IGDBSyncService {
	return &igdbSyncService{
		sqlDB:      sqlDB,
		elastic:    elastic,
		igdbClient: igdbClient, logger: zapLogger,
	}
}

func (s *igdbSyncService) TriggerGamesSync(w http.ResponseWriter, r *http.Request) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 1*time.Hour)
		defer cancel()

		err := s.SyncGames(ctx, domain.SyncTypeFull)
		if err != nil {
			s.logger.Errorf("[IGDB Sync] Sync failed: %v", err)
		}
	}()
	w.WriteHeader(http.StatusOK)
}

func (s *igdbSyncService) SyncGames(ctx context.Context, syncType domain.SyncType) (err error) {
	syncLog, err := s.sqlDB.Queries().CreateExternalSync(ctx, syncType)
	if err != nil {
		return err
	}
	s.logger.Infof("[IGDB Sync] Sync started: %v", syncLog.ID)

	var gamesProcessed int64
	defer func() {
		if err != nil {
			_ = s.sqlDB.Queries().CompleteExternalSyncWithError(ctx, syncLog.ID, err.Error())
			s.logger.Errorf("[IGDB Sync] Sync failed: %v", err)
		} else {
			_ = s.sqlDB.Queries().CompleteExternalSync(ctx, syncLog.ID, gamesProcessed)
			s.logger.Infof("[IGDB Sync] Sync completed: %v", syncLog.ID)
		}
	}()

	// Determine last sync timestamp for incremental syncs
	var lastSyncTimestamp *time.Time
	if syncType == domain.SyncTypeIncremental {
		lastSync, lErr := s.sqlDB.Queries().GetLastSuccessfulExternalSync(ctx, domain.SyncTypeIncremental)
		if lErr == nil && lastSync != nil {
			lastSyncTimestamp = lastSync.CompletedAt
		} else if lErr != nil && lErr != pgx.ErrNoRows {
			return lErr
		}
		s.logger.Debugf("[IGDB Sync] Last successful sync: %v", lastSyncTimestamp)
	}

	// Fetch games from IGDB
	games, gErr := s.igdbClient.GetUpdatedGames(ctx, lastSyncTimestamp)
	if gErr != nil {
		return gErr
	}
	s.logger.Debugf("[IGDB Sync] Fetched %d games", len(games))

	total := len(games)
	if total == 0 {
		return nil
	}

	batchSize := 100
	totalBatches := total / batchSize
	if total%batchSize != 0 {
		totalBatches++
	}

	batchDurations := make([]time.Duration, 0, totalBatches)

	for b := 0; b < totalBatches; b++ {
		batchStart := time.Now()
		start := b * batchSize
		end := start + batchSize
		if end > total {
			end = total
		}
		current := games[start:end]

		err = s.sqlDB.BeginTx(ctx, func(qtx sql.Queries) error {
			documents := make([]*storage.BulkIndexRequest, 0, len(current))

			for _, game := range current {
				// Websites serialization
				var websites []domain.ContentWebsite
				var serializedWebsites *json.RawMessage
				if game.Websites != nil {
					for _, website := range *game.Websites {
						if !website.Trusted {
							continue
						}
						websites = append(websites, domain.ContentWebsite{
							Trusted: website.Trusted,
							URL:     website.URL,
							Type:    website.Type.Type,
						})
					}
					if len(websites) > 0 {
						if jsonBytes, mErr := json.Marshal(websites); mErr == nil {
							raw := json.RawMessage(jsonBytes)
							serializedWebsites = &raw
						} else {
							s.logger.Errorf("[IGDB Sync] Error marshalling websites: %v", mErr)
						}
					}
				}

				// Release date
				var releaseDate *time.Time
				if game.FirstReleaseDate != nil && *game.FirstReleaseDate > 0 {
					date := time.Unix(*game.FirstReleaseDate, 0)
					releaseDate = &date
				}

				// Source URL
				var sourceUrl *string
				if game.URL != nil {
					sourceUrl = game.URL
				}

				// Cover key
				var coverKey *string
				if game.Cover != nil && game.Cover.ImageID != nil {
					coverKey = game.Cover.ImageID
				}

				id, uErr := qtx.UpsertGame(ctx, sql.UpsertGameParams{
					ExternalID:   game.ID,
					ReleaseDate:  releaseDate,
					Websites:     serializedWebsites,
					CoverKey:     coverKey,
					CoverKeyType: domain.ImageKeyTypeIGDB,
					SourceUrl:    sourceUrl,
					SourceType:   domain.ContentSourceIGDB,
				})
				if uErr != nil {
					s.logger.Warnf("[IGDB Sync] Error upserting game: %v. Game %d (%s) skipped.", uErr, game.ID, game.Name)
					continue
				}

				// Localizations
				names := map[string]string{utils.EnglishLocale: game.Name}
				if game.AlternativeNames != nil {
					for _, altName := range *game.AlternativeNames {
						comment := strings.ToLower(altName.Comment)
						switch {
						case strings.Contains(comment, "russian"):
							names[utils.RussianLocale] = altName.Name
						case strings.Contains(comment, "german"):
							names[utils.GermanLocale] = altName.Name
						case strings.Contains(comment, "spanish"):
							names[utils.SpanishLocale] = altName.Name
						case strings.Contains(comment, "english"):
							names[utils.EnglishLocale] = altName.Name
						}
					}
				}

				for locale, title := range names {
					if lErr := qtx.UpsertGameLocalization(ctx, sql.UpsertGameLocalizationParams{
						ContentID: id,
						Locale:    locale,
						Title:     title,
					}); lErr != nil {
						s.logger.Warnf("[IGDB Sync] Error upserting game localization: %v. Locale %s for game %s skipped.", lErr, locale, id)
						continue
					}
				}

				// Elastic document
				doc := &storage.BulkIndexRequest{
					ID: mapper.MapContentIDToMediaID(id, domain.ContentCategoryGames),
					Doc: &domain.ElasticContent{
						Popularity:   0,
						ImageKey:     coverKey,
						ImageKeyType: domain.ImageKeyTypeIGDB,
						EnglishName:  names[utils.EnglishLocale],
						RussianName:  names[utils.RussianLocale],
						GermanName:   names[utils.GermanLocale],
						SpanishName:  names[utils.SpanishLocale],
					},
				}
				documents = append(documents, doc)

				gamesProcessed++
			}

			if len(documents) == 0 {
				return nil
			}

			if biErr := s.elastic.BulkIndexDocuments(ctx, "igdb_games", documents); biErr != nil {
				s.logger.Warnf("[IGDB Sync] Error indexing documents: %v. Batch %d/%d skipped.", biErr, b+1, totalBatches)
				return biErr
			}
			return nil
		})
		if err != nil {
			s.logger.Warnf("[IGDB Sync] Error processing batch: %v. Batch %d/%d skipped.", err, b+1, totalBatches)
			continue
		}

		duration := time.Since(batchStart)
		batchDurations = append(batchDurations, duration)
		medianIndex := len(batchDurations) / 2
		medianDuration := batchDurations[medianIndex]
		batchesLeft := totalBatches - (b + 1)
		timeLeft := medianDuration.Seconds() * float64(batchesLeft)
		percent := float64(gamesProcessed) / float64(total) * 100
		s.logger.Infof("[IGDB Sync] Committed %d/%d games (%.2f%%, %d/%d batches) in %vms. Estimated time left: %.2fs.", gamesProcessed, total, percent, b+1, totalBatches, duration.Milliseconds(), timeLeft)
	}

	return nil
}
