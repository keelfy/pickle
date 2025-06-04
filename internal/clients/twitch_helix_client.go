package clients

import (
	"context"
	"fmt"

	"github.com/nicklaw5/helix/v2"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/utils"
)

type TwitchHelixClient interface {
	GetHelixUser(ctx context.Context, accessToken string) (*helix.User, error)
	RequestUserAccessToken(ctx context.Context, code string) (*helix.AccessCredentials, error)
	GetAuthorizationURL(ctx context.Context, state string) (string, error)
}

type twitchHelixClient struct {
}

func NewTwitchHelixClient(ctx context.Context) TwitchHelixClient {
	return &twitchHelixClient{}
}

var (
	twitchClientID     = config.GetTwitchClientID()
	twitchClientSecret = config.GetTwitchClientSecret()
	twitchRedirectURI  = config.GetTwitchRedirectURI()
)

func (c *twitchHelixClient) GetHelixUser(ctx context.Context, accessToken string) (*helix.User, error) {
	userID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting user id from context: %w", err)
	}

	client, err := helix.NewClientWithContext(ctx, &helix.Options{
		ClientID:        twitchClientID,
		ClientSecret:    twitchClientSecret,
		UserAccessToken: accessToken,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating twitch helix client: %w", err)
	}

	user, err := client.GetUsers(&helix.UsersParams{
		IDs: []string{userID.String()},
	})
	if err != nil {
		return nil, fmt.Errorf("error getting twitch user: %w", err)
	}

	return &user.Data.Users[0], nil
}

func (c *twitchHelixClient) GetAuthorizationURL(ctx context.Context, state string) (string, error) {
	client, err := helix.NewClientWithContext(ctx, &helix.Options{
		ClientID:    twitchClientID,
		RedirectURI: twitchRedirectURI,
	})
	if err != nil {
		return "", fmt.Errorf("error creating twitch helix client: %w", err)
	}

	authURL := client.GetAuthorizationURL(&helix.AuthorizationURLParams{
		ResponseType: "code",
		Scopes:       []string{"channel:read:redemptions"},
		State:        state,
		ForceVerify:  false,
	})

	return authURL, nil
}

func (c *twitchHelixClient) RequestUserAccessToken(ctx context.Context, code string) (*helix.AccessCredentials, error) {
	client, err := helix.NewClient(&helix.Options{
		ClientID:     twitchClientID,
		ClientSecret: twitchClientSecret,
		RedirectURI:  twitchRedirectURI,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating twitch helix client: %w", err)
	}

	resp, err := client.RequestUserAccessToken(code)
	if err != nil {
		return nil, fmt.Errorf("error requesting user access token: %w", err)
	}

	return &resp.Data, nil
}
