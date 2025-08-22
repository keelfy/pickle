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
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/mapper"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
)

type TMDBSyncService interface {
	SyncMovies(ctx context.Context, syncType domain.SyncType) error
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
		err := s.SyncMovies(apiCtx, domain.SyncTypeFull)
		if err != nil {
			logger.Errorf(apiCtx, "[TMDB Sync] Sync failed: %v", err)
		}
	}()
	w.WriteHeader(http.StatusOK)
}

var (
	batchSize = 100
	pageLimit = 10
	rateLimit = 100 * time.Millisecond
)

func (s *tmdbSyncService) getLastSyncTimestamp(ctx context.Context, syncType domain.SyncType) *time.Time {
	lastSync, err := s.sqlDB.Queries().GetLastSuccessfulExternalSync(ctx, syncType)
	if err == nil {
		return lastSync.CompletedAt
	} else if err != pgx.ErrNoRows {
		logger.Errorf(ctx, "[TMDB Sync] Error getting last successful sync timestamp: %v", err)
		return nil
	}
	return nil
}

func (s *tmdbSyncService) createTmdbSyncLog(ctx context.Context, syncType domain.SyncType) (*domain.ExternalSyncLog, error) {
	syncLog, err := s.sqlDB.Queries().CreateExternalSync(ctx, syncType)
	if err != nil {
		logger.Errorf(ctx, "[TMDB Sync] Error creating sync log: %v", err)
		return nil, err
	}
	return syncLog, nil
}

func (s *tmdbSyncService) completeTmdbSyncLog(ctx context.Context, syncLog *domain.ExternalSyncLog, moviesProcessed int64, syncError error) {
	var err error

	if syncError != nil {
		err = s.sqlDB.Queries().CompleteExternalSyncWithError(ctx, syncLog.ID, syncError.Error())
		logger.Errorf(ctx, "[TMDB Sync] Sync failed: %v", err)
	} else {
		err = s.sqlDB.Queries().CompleteExternalSync(ctx, syncLog.ID, moviesProcessed)
		logger.Infof(ctx, "[TMDB Sync] Sync completed: %v", syncLog.ID)
	}

	if err != nil {
		logger.Errorf(ctx, "[TMDB Sync] Error completing sync log: %v", err)
	}
}

func (s *tmdbSyncService) getMoviesToProcess(response *domain.TMDBMovieChangesResponse) (pagesToProcess int, moviesToProcess int64) {
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

func (s *tmdbSyncService) fetchMoviesDetails(ctx context.Context, movies []domain.TMDBMovieChange) []*domain.TMDBMovie {
	movieDetails := make([]*domain.TMDBMovie, len(movies))
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

func (s *tmdbSyncService) upsertMovie(ctx context.Context, qtx sql.Queries, movie *domain.TMDBMovie) (id uuid.UUID, err error) {
	var websites []domain.ContentWebsite
	var serializedWebsites *json.RawMessage

	if movie.IMDBID != nil {
		websites = append(websites, domain.ContentWebsite{
			Trusted: true,
			URL:     fmt.Sprintf("https://www.imdb.com/title/%s", *movie.IMDBID),
			Type:    domain.TMDBWebsiteIMDB,
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

	return qtx.UpsertMovie(ctx, sql.UpsertMovieParams{
		ExternalID:   movie.ID,
		ReleaseDate:  releaseDate,
		Websites:     serializedWebsites,
		CoverKey:     movie.PosterPath,
		CoverKeyType: domain.ImageKeyTypeTMDB,
		SourceUrl:    sourceUrl,
		SourceType:   domain.ContentSourceTMDB,
	})
}

func (s *tmdbSyncService) getLocalizations(movie *domain.TMDBMovie) map[string]string {
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

func (s *tmdbSyncService) upsertMovieLocalizations(ctx context.Context, qtx sql.Queries, contentID uuid.UUID, localizations map[string]string) error {
	for locale, title := range localizations {
		err := qtx.UpsertMovieLocalization(ctx, sql.UpsertMovieLocalizationParams{
			ContentID: contentID,
			Locale:    locale,
			Title:     title,
		})
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error upserting movie localization: %v. Locale %s for movie %d (%s) skipped.", err, locale, contentID, localizations[utils.EnglishLocale])
			continue
		}
	}
	return nil
}

func (s *tmdbSyncService) createMovieElasticDoc(contentID uuid.UUID, movie *domain.TMDBMovie, localizations map[string]string) *storage.BulkIndexRequest {
	id := mapper.MapContentIDToMediaID(contentID, domain.ContentCategoryMovies)
	request := &storage.BulkIndexRequest{
		ID: id,
		Doc: &domain.ElasticContent{
			Popularity:   movie.Popularity,
			ImageKey:     movie.PosterPath,
			ImageKeyType: domain.ImageKeyTypeTMDB,
			EnglishName:  localizations[utils.EnglishLocale],
			RussianName:  localizations[utils.RussianLocale],
			GermanName:   localizations[utils.GermanLocale],
			SpanishName:  localizations[utils.SpanishLocale],
		},
	}
	return request
}

func (s *tmdbSyncService) SyncMovies(ctx context.Context, syncType domain.SyncType) error {
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
	if syncType == domain.SyncTypeIncremental {
		lastSyncTimestamp = s.getLastSyncTimestamp(ctx, domain.SyncTypeIncremental)
		logger.Debugf(ctx, "[TMDB Sync] Last successful sync: %v", lastSyncTimestamp)
	}

	var initialResponse *domain.TMDBMovieChangesResponse

	// Fetch movies from TMDB
	if syncType == domain.SyncTypeFull {
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

		var response *domain.TMDBMovieChangesResponse
		if syncType == domain.SyncTypeFull {
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
		err = s.sqlDB.BeginTx(ctx, func(qtx sql.Queries) error {
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
				return err
			}
			return nil
		})
		if err != nil {
			logger.Warnf(ctx, "[TMDB Sync] Error upserting movies: %v. Page %d/%d skipped.", err, page, pagesToProcess)
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
