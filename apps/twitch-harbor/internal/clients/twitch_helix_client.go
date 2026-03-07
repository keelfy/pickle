package clients

import (
	"context"
	"fmt"

	"github.com/keelfy/helix/v2"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/model"
)

type TwitchHelixClient interface {
	RequestAppAccessToken(ctx context.Context) (*model.TwitchAuth, error)
	RefreshTwitchToken(ctx context.Context, auth *model.TwitchAuth) (*model.TwitchAuth, error)
	GetCustomRewards(ctx context.Context, auth *db.TwitchAuthorization) ([]*helix.ChannelCustomReward, error)
	GetCustomRewardRedemptions(ctx context.Context, auth *db.TwitchAuthorization, rewardID string) ([]*helix.ChannelCustomRewardsRedemption, error)
}

type twitchHelixClient struct {
}

func NewTwitchHelixClient(ctx context.Context) TwitchHelixClient {
	return &twitchHelixClient{}
}

const (
	RewardRedemptionStatusUnfulfilled = "UNFULFILLED"
	RewardRedemptionStatusFulfilled   = "FULFILLED"
	RewardRedemptionStatusCancelled   = "CANCELLED"
)

var (
	twitchClientID     = config.GetTwitchClientID()
	twitchClientSecret = config.GetTwitchClientSecret()
)

func (c *twitchHelixClient) createHelixClientWithAuth(ctx context.Context, auth *db.TwitchAuthorization) (*helix.Client, error) {
	helixClient, err := helix.NewClientWithContext(ctx, &helix.Options{
		ClientID:        twitchClientID,
		ClientSecret:    twitchClientSecret,
		UserAccessToken: auth.AccessToken,
		RefreshToken:    auth.RefreshToken,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create helix client: %w", err)
	}
	return helixClient, nil
}

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

func (c *twitchHelixClient) GetCustomRewards(ctx context.Context, auth *db.TwitchAuthorization) ([]*helix.ChannelCustomReward, error) {
	helixClient, err := c.createHelixClientWithAuth(ctx, auth)
	if err != nil {
		return nil, err
	}

	rewards, err := helixClient.GetCustomRewards(&helix.GetCustomRewardsParams{
		BroadcasterID: auth.BroadcasterID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get custom rewards: %w", err)
	}

	res := make([]*helix.ChannelCustomReward, 0)
	for _, reward := range rewards.Data.ChannelCustomRewards {
		res = append(res, &reward)
	}

	return res, nil
}

func (c *twitchHelixClient) GetCustomRewardRedemptions(ctx context.Context, auth *db.TwitchAuthorization, rewardID string) ([]*helix.ChannelCustomRewardsRedemption, error) {
	helixClient, err := c.createHelixClientWithAuth(ctx, auth)
	if err != nil {
		return nil, err
	}

	redemptions, err := helixClient.GetCustomRewardsRedemptions(&helix.GetCustomRewardsRedemptionsParams{
		BroadcasterID: auth.BroadcasterID,
		RewardID:      rewardID,
		Status:        RewardRedemptionStatusUnfulfilled,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get custom rewards redemptions: %w", err)
	}

	res := make([]*helix.ChannelCustomRewardsRedemption, 0)
	for _, redemption := range redemptions.Data.Redemptions {
		res = append(res, &redemption)
	}

	return res, nil
}
