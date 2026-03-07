package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/domain"
	"go.uber.org/zap"
)

const (
	tmdbBaseURL = "https://api.themoviedb.org/3"

	// Endpoints
	movieEndpoint    = "/movie"
	changesEndpoint  = "/movie/changes"
	discoverEndpoint = "/discover/movie"
)

type TMDBClient interface {
	// GetUpdatedMovies(ctx context.Context, lastSyncTimestamp *time.Time) ([]*models.TMDBMovie, error)
	GetChangedMovieIDs(ctx context.Context, page int, lastSyncTimestamp *time.Time) (*domain.TMDBMovieChangesResponse, error)
	GetMovieDetails(ctx context.Context, movieID int64) (*domain.TMDBMovie, error)
	GetMovieDiscover(ctx context.Context, page int) (*domain.TMDBMovieChangesResponse, error)
}

type tmdbClient struct {
	httpClient *http.Client
	apiKey     string
	baseURL    string
	logger     *zap.SugaredLogger
}

func NewTMDBClient(zapLogger *zap.SugaredLogger) TMDBClient {
	baseURL := config.GetTMDBBaseURL()
	if baseURL == "" {
		baseURL = tmdbBaseURL
	}

	return &tmdbClient{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		apiKey:     config.GetTMDBAPIKey(),
		baseURL:    baseURL, logger: zapLogger,
	}
}

// func (c *tmdbClient) GetUpdatedMovies(ctx context.Context, lastSyncTimestamp *time.Time) ([]*models.TMDBMovie, error) {
// 	if c.apiKey == "" {
// 		return nil, fmt.Errorf("TMDB API key is not set")
// 	}

// 	// Get changed movie IDs
// 	changedMovieIDs, err := c.GetChangedMovieIDs(ctx, lastSyncTimestamp)
// 	if err != nil {
// 		return nil, fmt.Errorf("getting changed movie IDs: %w", err)
// 	}
// 	logger.Debugf(ctx, "[TMDB Sync] Found %d changed movies", len(changedMovieIDs))

// 	// temporary limit to avoid overfilling the test database
// 	requestedLimit := 100
// 	totalRequested := 0

// 	// Fetch movie details for each changed movie
// 	allMovies := []*models.TMDBMovie{}
// 	for i, movieID := range changedMovieIDs {
// 		if totalRequested >= requestedLimit {
// 			break
// 		}

// 		time.Sleep(tmdbRequestDelay) // avoid rate limiting

// 		movie, err := c.GetMovieDetails(ctx, movieID)
// 		if err != nil {
// 			logger.Warnf(ctx, "[TMDB Sync] Failed to fetch movie %d: %v", movieID, err)
// 			continue
// 		}

// 		allMovies = append(allMovies, movie)

// 		if (i+1)%100 == 0 {
// 			logger.Debugf(ctx, "[TMDB Sync] Fetched %d/%d movies...", i+1, len(changedMovieIDs))
// 		}

// 		totalRequested++
// 	}

// 	logger.Debugf(ctx, "[TMDB Sync] Fetched all %d movies", len(allMovies))
// 	return allMovies, nil
// }

func (c *tmdbClient) GetChangedMovieIDs(ctx context.Context, page int, lastSyncTimestamp *time.Time) (*domain.TMDBMovieChangesResponse, error) {
	url := fmt.Sprintf("%s%s?api_key=%s&page=%d", c.baseURL, changesEndpoint, c.apiKey, page)
	if lastSyncTimestamp != nil {
		url += fmt.Sprintf("&start_date=%s", lastSyncTimestamp.Format("2006-01-02"))
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	var changesResp domain.TMDBMovieChangesResponse
	if err := c.do(req, &changesResp); err != nil {
		return nil, fmt.Errorf("fetching changes: %w", err)
	}

	return &changesResp, nil
}

func (c *tmdbClient) GetMovieDetails(ctx context.Context, movieID int64) (*domain.TMDBMovie, error) {
	url := fmt.Sprintf("%s%s/%d?api_key=%s&append_to_response=translations",
		c.baseURL, movieEndpoint, movieID, c.apiKey)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	var movie domain.TMDBMovie
	if err := c.do(req, &movie); err != nil {
		return nil, fmt.Errorf("fetching movie details: %w", err)
	}

	return &movie, nil
}

func (c *tmdbClient) GetMovieDiscover(ctx context.Context, page int) (*domain.TMDBMovieChangesResponse, error) {
	url := fmt.Sprintf("%s%s?api_key=%s&page=%d&sort_by=popularity.desc", c.baseURL, discoverEndpoint, c.apiKey, page)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	var discoverResp domain.TMDBMovieChangesResponse
	if err := c.do(req, &discoverResp); err != nil {
		return nil, fmt.Errorf("fetching movie discover: %w", err)
	}

	return &discoverResp, nil
}

// Helper method for making requests
func (c *tmdbClient) do(req *http.Request, v any) error {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("TMDB API error: %s", resp.Status)
	}

	return json.NewDecoder(resp.Body).Decode(v)
}
