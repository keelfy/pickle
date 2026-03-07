package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/domain"
	"go.uber.org/zap"
)

const (
	baseURL       = "https://api.igdb.com/v4"
	twitchAuthURL = "https://id.twitch.tv/oauth2/token"

	// Endpoints
	gamesEndpoint = "/games"

	// requests
	pageSize = 500
)

type IGDBClient interface {
	GetUpdatedGames(ctx context.Context, lastSyncTimestamp *time.Time) ([]*domain.IGDBGame, error)
}

type idgbClient struct {
	httpClient   *http.Client
	clientID     string
	clientSecret string
	accessToken  string
	tokenExpiry  time.Time
	logger       *zap.SugaredLogger
}

type TwitchAuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

func NewIGDBClient(zapLogger *zap.SugaredLogger) IGDBClient {
	return &idgbClient{
		httpClient:   &http.Client{Timeout: 10 * time.Second},
		clientID:     config.GetTwitchClientID(),
		clientSecret: config.GetTwitchClientSecret(), logger: zapLogger,
	}
}

func (c *idgbClient) authenticate(ctx context.Context) error {
	if c.accessToken != "" && time.Now().Before(c.tokenExpiry) {
		return nil
	}

	if c.clientID == "" || c.clientSecret == "" {
		return fmt.Errorf("client ID or secret is not set")
	}

	url := fmt.Sprintf("%s?client_id=%s&client_secret=%s&grant_type=client_credentials",
		twitchAuthURL, c.clientID, c.clientSecret)

	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return fmt.Errorf("creating auth request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("authenticating with Twitch: %w", err)
	}
	defer resp.Body.Close()

	var authResp TwitchAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return fmt.Errorf("decoding auth response: %w", err)
	}

	c.accessToken = authResp.AccessToken
	c.tokenExpiry = time.Now().Add(time.Duration(authResp.ExpiresIn) * time.Second)

	return nil
}

var (
	igdbItemsLimit   = config.GetIGDBSyncItemsLimit()
	igdbRequestDelay = config.GetIGDBRequestDelay()
)

func (c *idgbClient) GetUpdatedGames(ctx context.Context, lastSyncTimestamp *time.Time) ([]*domain.IGDBGame, error) {
	if err := c.authenticate(ctx); err != nil {
		return nil, err
	}

	count, err := c.getCount(ctx, lastSyncTimestamp)
	if err != nil {
		return nil, fmt.Errorf("getting count: %w", err)
	}

	if count > igdbItemsLimit && igdbItemsLimit > 0 {
		count = igdbItemsLimit
	}
	c.logger.Debugf("[IGDB Sync] Total games to fetch: %d", count)

	offset := 0
	allGames := []*domain.IGDBGame{}

	for offset < count {
		time.Sleep(igdbRequestDelay) // avoid rate limiting

		games, err := c.fetchIDGBGames(ctx, lastSyncTimestamp, offset)
		if err != nil {
			return nil, fmt.Errorf("fetching games: %w", err)
		}
		allGames = append(allGames, games...)
		offset = len(allGames)
		c.logger.Debugf("[IGDB Sync] Fetched %d/%d games...", offset, count)
	}
	c.logger.Debugf("[IGDB Sync] Fetched all %d games", len(allGames))
	return allGames, nil
}

func (c *idgbClient) fetchIDGBGames(ctx context.Context, lastSyncTimestamp *time.Time, offset int) ([]*domain.IGDBGame, error) {
	query := strings.Builder{}
	query.WriteString(`
		fields id,name,updated_at,first_release_date,url,
		cover.image_id,cover.url,
		websites.trusted,websites.url,websites.type,websites.type.type,
		alternative_names.comment,alternative_names.name;
		where version_parent = null
	`)
	if lastSyncTimestamp != nil {
		query.WriteString(fmt.Sprintf(" & updated_at > %d", lastSyncTimestamp.Unix()))
	}
	query.WriteString(fmt.Sprintf("; limit 500; offset %d", offset))
	query.WriteString(";")

	req, err := c.newRequest(ctx, "POST", gamesEndpoint, []byte(query.String()))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	var games []*domain.IGDBGame
	if err := c.do(req, &games); err != nil {
		return nil, fmt.Errorf("fetching games: %w", err)
	}

	return games, nil
}

func (c *idgbClient) getCount(ctx context.Context, lastSyncTimestamp *time.Time) (int, error) {
	query := strings.Builder{}
	query.WriteString("fields id;")
	query.WriteString(" where version_parent = null") // Exclude DLCs and editions
	if lastSyncTimestamp != nil {
		query.WriteString(fmt.Sprintf(" & updated_at > %d", lastSyncTimestamp.Unix()))
	}
	query.WriteString(";")

	req, err := c.newRequest(ctx, "POST", gamesEndpoint+"/count", []byte(query.String()))
	if err != nil {
		return 0, err
	}

	var count struct {
		Count int `json:"count"`
	}
	if err := c.do(req, &count); err != nil {
		return 0, err
	}

	return count.Count, nil
}

// Helper methods for making requests
func (c *idgbClient) newRequest(ctx context.Context, method, endpoint string, body []byte) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, method, baseURL+endpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Client-ID", c.clientID)
	req.Header.Set("Authorization", "Bearer "+c.accessToken)
	req.Header.Set("Content-Type", "application/json")

	return req, nil
}

func (c *idgbClient) do(req *http.Request, v interface{}) error {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("IGDB API error: %s", resp.Status)
	}

	return json.NewDecoder(resp.Body).Decode(v)
}
