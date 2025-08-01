package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type TMDBSyncService interface {
	SyncMovies(ctx context.Context, syncType db.IgdbSyncType) error
	TriggerMoviesSync(apiCtx context.Context, w http.ResponseWriter, r *http.Request)
}

type tmdbSyncService struct {
	sqlDB      storage.RelationalStorage
	elastic    storage.ElasticStorage
	tmdbClient clients.TMDBClient
}

func NewTMDBSyncService(sqlDB storage.RelationalStorage, elastic storage.ElasticStorage, tmdbClient clients.TMDBClient) TMDBSyncService {
	return &tmdbSyncService{
		sqlDB:      sqlDB,
		elastic:    elastic,
		tmdbClient: tmdbClient,
	}
}

func (s *tmdbSyncService) TriggerMoviesSync(apiCtx context.Context, w http.ResponseWriter, r *http.Request) {
	go func() {
		err := s.SyncMovies(apiCtx, db.IgdbSyncTypeFull)
		if err != nil {
			logger.Errorf(apiCtx, "[TMDB Sync] Sync failed: %v", err)
		}
	}()
	w.WriteHeader(http.StatusNoContent)
}

var (
	batchSize = 100
	pageLimit = 10
	rateLimit = 100 * time.Millisecond
)

func (s *tmdbSyncService) getLastSyncTimestamp(ctx context.Context, syncType db.IgdbSyncType) *time.Time {
	lastSync, err := s.sqlDB.Queries().GetLastSuccessfulTMDBsync(ctx, syncType)
	if err == nil {
		return lastSync.CompletedAt
	} else if err != pgx.ErrNoRows {
		logger.Errorf(ctx, "[TMDB Sync] Error getting last successful sync timestamp: %v", err)
		return nil
	}
	return nil
}

func (s *tmdbSyncService) createTmdbSyncLog(ctx context.Context, syncType db.IgdbSyncType) (*db.TmdbSyncLog, error) {
	syncLog, err := s.sqlDB.Queries().CreateTMDBSync(ctx, syncType)
	if err != nil {
		logger.Errorf(ctx, "[TMDB Sync] Error creating sync log: %v", err)
		return nil, err
	}
	return syncLog, nil
}

func (s *tmdbSyncService) completeTmdbSyncLog(ctx context.Context, syncLog *db.TmdbSyncLog, moviesProcessed int64, syncError error) {
	var err error

	if syncError != nil {
		err = s.sqlDB.Queries().CompleteTMDBSyncWithError(ctx, db.CompleteTMDBSyncWithErrorParams{
			ID:           syncLog.ID,
			ErrorMessage: syncError.Error(),
		})
		logger.Errorf(ctx, "[TMDB Sync] Sync failed: %v", err)
	} else {
		err = s.sqlDB.Queries().CompleteTMDBSync(ctx, db.CompleteTMDBSyncParams{
			ID:              syncLog.ID,
			MoviesProcessed: moviesProcessed,
		})
		logger.Infof(ctx, "[TMDB Sync] Sync completed: %v", syncLog.ID)
	}

	if err != nil {
		logger.Errorf(ctx, "[TMDB Sync] Error completing sync log: %v", err)
	}
}

func (s *tmdbSyncService) getMoviesToProcess(response *models.TMDBMovieChangesResponse) (pagesToProcess int, moviesToProcess int64) {
	pagesToProcess = int(response.TotalResults / int64(batchSize))
	if response.TotalResults%int64(batchSize) != 0 {
		pagesToProcess++
	}

	if pagesToProcess > pageLimit {
		pagesToProcess = pageLimit
	}

	moviesToProcess = response.TotalResults
	return
}

func (s *tmdbSyncService) fetchMoviesDetails(ctx context.Context, movies []models.TMDBMovieChange) []*models.TMDBMovie {
	movieDetails := make([]*models.TMDBMovie, len(movies))
	var err error

	for i, movie := range movies {
		startTime := time.Now()
		movieDetails[i], err = s.tmdbClient.GetMovieDetails(ctx, movie.ID)
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error fetching movie details: %v", err)
			continue
		}
		logger.Debugf(ctx, "[TMDB Sync] Fetched movie details for %d (%s) in %vms.", movie.ID, movieDetails[i].Title, time.Since(startTime).Milliseconds())

		// avoid rate limiting
		time.Sleep(rateLimit)
	}
	return movieDetails
}

func (s *tmdbSyncService) upsertMovie(ctx context.Context, qtx *db.Queries, movie *models.TMDBMovie) (id uuid.UUID, err error) {
	var websites []models.ContentWebsite
	var serializedWebsites *json.RawMessage

	if movie.IMDBID != nil {
		websites = append(websites, models.ContentWebsite{
			Trusted: true,
			URL:     fmt.Sprintf("https://www.imdb.com/title/%s", *movie.IMDBID),
			Type:    models.TMDBWebsiteIMDB,
		})
	}

	if len(websites) > 0 {
		jsonBytes, err := json.Marshal(websites)
		if err == nil {
			rawMessage := json.RawMessage(jsonBytes)
			serializedWebsites = &rawMessage
		} else {
			logger.Errorf(ctx, "[TMDB Sync] Error marshalling websites: %v", err)
		}
	}

	var releaseDate *time.Time
	if movie.ReleaseDate != "" {
		date, err := time.Parse("2006-01-02", movie.ReleaseDate)
		if err == nil {
			releaseDate = &date
		} else {
			logger.Errorf(ctx, "[TMDB Sync] Error parsing release date: %v", err)
		}
	}

	var sourceUrl *string
	if movie.IMDBID != nil {
		url := fmt.Sprintf("https://www.themoviedb.org/movie/%d", movie.ID)
		sourceUrl = &url
	}

	return qtx.UpsertMovie(ctx, db.UpsertMovieParams{
		ExternalID:   movie.ID,
		ReleaseDate:  releaseDate,
		Websites:     serializedWebsites,
		CoverKey:     movie.PosterPath,
		CoverKeyType: db.NullImageKeyType{ImageKeyType: db.ImageKeyTypeTmdb, Valid: true},
		SourceUrl:    sourceUrl,
		SourceType:   db.ContentSourceTmdb,
	})
}

func (s *tmdbSyncService) getLocalizations(movie *models.TMDBMovie) map[string]string {
	names := make(map[string]string)
	names[utils.EnglishLocale] = movie.Title

	for _, translation := range movie.Translations.Translations {
		title := translation.Data.Title
		if len(title) > 0 && slices.Contains(utils.AllowedLocales, translation.ISO6391) {
			names[translation.ISO6391] = title
		}
	}
	return names
}

func (s *tmdbSyncService) upsertMovieLocalizations(ctx context.Context, qtx *db.Queries, contentID uuid.UUID, localizations map[string]string) error {
	for locale, title := range localizations {
		err := qtx.UpsertMovieLocalization(ctx, db.UpsertMovieLocalizationParams{
			ContentID: contentID,
			Lang:      locale,
			Title:     title,
		})
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error upserting movie localization: %v. Locale %s for movie %d (%s) skipped.", err, locale, contentID, localizations[utils.EnglishLocale])
			continue
		}
	}
	return nil
}

func (s *tmdbSyncService) createMovieElasticDoc(contentID uuid.UUID, movie *models.TMDBMovie, localizations map[string]string) *storage.BulkIndexRequest {
	request := &storage.BulkIndexRequest{
		ID: contentID.String(),
		Doc: &models.BasicElasticContent{
			Popularity:   movie.Popularity,
			ImageKey:     movie.PosterPath,
			ImageKeyType: db.ImageKeyTypeTmdb,
			EnglishName:  localizations[utils.EnglishLocale],
			RussianName:  localizations[utils.RussianLocale],
			GermanName:   localizations[utils.GermanLocale],
			SpanishName:  localizations[utils.SpanishLocale],
		},
	}
	return request
}

func (s *tmdbSyncService) SyncMovies(ctx context.Context, syncType db.IgdbSyncType) error {
	syncLog, err := s.createTmdbSyncLog(ctx, syncType)
	if err != nil {
		return err
	}
	logger.Infof(ctx, "[TMDB Sync] Full sync started: %v", syncLog.ID)

	var moviesProcessed int64

	defer func() {
		s.completeTmdbSyncLog(ctx, syncLog, moviesProcessed, err)
	}()

	var lastSyncTimestamp *time.Time
	if syncType == db.IgdbSyncTypeIncremental {
		lastSyncTimestamp = s.getLastSyncTimestamp(ctx, db.IgdbSyncTypeIncremental)
		logger.Debugf(ctx, "[TMDB Sync] Last successful sync: %v", lastSyncTimestamp)
	}

	var initialResponse *models.TMDBMovieChangesResponse

	// Fetch movies from TMDB
	if syncType == db.IgdbSyncTypeFull {
		initialResponse, err = s.tmdbClient.GetMovieDiscover(ctx, 1)
	} else {
		initialResponse, err = s.tmdbClient.GetChangedMovieIDs(ctx, 1, lastSyncTimestamp)
	}
	if err != nil {
		return err
	}
	logger.Debugf(ctx, "[TMDB Sync] Found %d movies (%d pages)", initialResponse.TotalResults, initialResponse.TotalPages)

	pagesToProcess, moviesToProcess := s.getMoviesToProcess(initialResponse)

	var syncStartedAt time.Time
	var syncEndedAt time.Time

	syncDurations := make([]time.Duration, 0, pagesToProcess)

	for page := 1; page <= pagesToProcess; page++ {
		syncStartedAt = time.Now()

		// avoid rate limiting
		time.Sleep(rateLimit)

		var response *models.TMDBMovieChangesResponse
		if syncType == db.IgdbSyncTypeFull {
			response, err = s.tmdbClient.GetMovieDiscover(ctx, page)
		} else {
			response, err = s.tmdbClient.GetChangedMovieIDs(ctx, page, lastSyncTimestamp)
		}
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error fetching movies: %v. Page %d/%d skipped.", err, page, pagesToProcess)
			continue
		}
		logger.Debugf(ctx, "[TMDB Sync] Fetched %d movies from page %d/%d.", len(response.Results), page, pagesToProcess)

		pagesToProcess, moviesToProcess = s.getMoviesToProcess(response)

		// request movie details
		movieDetails := s.fetchMoviesDetails(ctx, response.Results)
		logger.Debugf(ctx, "[TMDB Sync] Fetched %d movie details.", len(movieDetails))

		// Begin transaction
		tx, err := s.sqlDB.Begin(ctx)
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error beginning transaction: %v. Page %d/%d skipped.", err, page, pagesToProcess)
			continue
		}
		qtx := s.sqlDB.Queries().WithTx(tx)

		var documents []*storage.BulkIndexRequest

		for _, movie := range movieDetails {
			id, err := s.upsertMovie(ctx, qtx, movie)
			if err != nil {
				logger.Warnf(ctx, "[TMDB Sync] Error upserting movie: %v. Movie %d (%s) skipped.", err, movie.ID, movie.Title)
				continue
			}

			localizations := s.getLocalizations(movie)
			err = s.upsertMovieLocalizations(ctx, qtx, id, localizations)
			if err != nil {
				logger.Warnf(ctx, "[TMDB Sync] Error upserting movie localizations: %v. Movie %d (%s) skipped.", err, movie.ID, movie.Title)
				continue
			}

			doc := s.createMovieElasticDoc(id, movie, localizations)
			documents = append(documents, doc)

			moviesProcessed++
		}

		err = s.elastic.BulkIndexDocuments(ctx, "tmdb_movies", documents)
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error indexing documents: %v. Page %d/%d skipped.", err, page, pagesToProcess)
			tx.Rollback(ctx)
			continue
		}

		err = tx.Commit(ctx)
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error committing transaction: %v. Page %d/%d skipped.", err, page, pagesToProcess)
			continue
		}

		syncEndedAt = time.Now()
		// calculate duration of the current page
		duration := syncEndedAt.Sub(syncStartedAt)
		// calculate percentage of movies processed
		moviesPercentage := float64(moviesProcessed) / float64(moviesToProcess) * 100
		// calculate median duration of all pages
		syncDurations = append(syncDurations, duration)
		medianIndex := len(syncDurations) / 2
		medianDuration := syncDurations[medianIndex]
		// calculate number of pages left
		pagesLeft := pagesToProcess - page
		// calculate estimated time left
		timeLeft := medianDuration.Seconds() * float64(pagesLeft)
		logger.Infof(ctx, "[TMDB Sync] Committed %d/%d movies (%.2f%%, %d/%d pages) in %vms. Estimated time left: %.2fs.", moviesProcessed, moviesToProcess, moviesPercentage, page, pagesToProcess, duration.Milliseconds(), timeLeft)
	}

	return nil
}
