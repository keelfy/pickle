package clients

import (
	"context"
	"fmt"

	"github.com/nicklaw5/helix/v2"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/model"
)

type TwitchHelixClient interface {
	RequestAppAccessToken(ctx context.Context) (*model.TwitchAuth, error)
	RefreshTwitchToken(ctx context.Context, auth *model.TwitchAuth) (*model.TwitchAuth, error)
	GetCustomRewards(ctx context.Context, auth *db.TwitchAuthorization) ([]helix.ChannelCustomReward, error)
}

type twitchHelixClient struct {
}

func NewTwitchHelixClient(ctx context.Context) TwitchHelixClient {
	return &twitchHelixClient{}
}

var (
	twitchClientID     = config.GetTwitchClientID()
	twitchClientSecret = config.GetTwitchClientSecret()
)

func (c *twitchHelixClient) RequestAppAccessToken(ctx context.Context) (*model.TwitchAuth, error) {
	helixClient, err := helix.NewClientWithContext(ctx, &helix.Options{
		ClientID:     twitchClientID,
		ClientSecret: twitchClientSecret,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create helix client: %w", err)
	}

	response, err := helixClient.RequestAppAccessToken([]string{"channel:read:redemptions"})
	if err != nil {
		return nil, fmt.Errorf("failed to request app access token: %w", err)
	}

	return &model.TwitchAuth{
		AccessToken:  response.Data.AccessToken,
		RefreshToken: response.Data.RefreshToken,
		// ExpiresIn:    response.Data.ExpiresIn,
	}, nil
}

func (c *twitchHelixClient) RefreshTwitchToken(ctx context.Context, auth *model.TwitchAuth) (*model.TwitchAuth, error) {
	helixClient, err := helix.NewClientWithContext(ctx, &helix.Options{
		ClientID:       twitchClientID,
		ClientSecret:   twitchClientSecret,
		AppAccessToken: auth.AccessToken,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create helix client: %w", err)
	}

	response, err := helixClient.RefreshUserAccessToken(auth.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh user access token: %w", err)
	}

	return &model.TwitchAuth{
		AccessToken:  response.Data.AccessToken,
		RefreshToken: response.Data.RefreshToken,
		// ExpiresIn:    response.Data.ExpiresIn,
	}, nil
}

func (c *twitchHelixClient) GetCustomRewards(ctx context.Context, auth *db.TwitchAuthorization) ([]helix.ChannelCustomReward, error) {
	helixClient, err := helix.NewClientWithContext(ctx, &helix.Options{
		ClientID:        twitchClientID,
		ClientSecret:    twitchClientSecret,
		UserAccessToken: auth.AccessToken,
		RefreshToken:    auth.RefreshToken,
	})

	rewards, err := helixClient.GetCustomRewards(&helix.GetCustomRewardsParams{
		BroadcasterID: auth.BroadcasterID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get custom rewards: %w", err)
	}

	return rewards.Data.ChannelCustomRewards, nil
}
