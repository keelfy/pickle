package service

import (
	"context"
	"sync"

	"github.com/google/uuid"
	"github.com/keelfy/helix/v2"
	"github.com/ory/client-go"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/domain"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

type TwitchRewardService interface {
	GetAvailableTwitchRewards(ctx context.Context, session *client.Session) ([]*helix.ChannelCustomReward, error)
	GetExistingTwitchRewardsRedemptions(ctx context.Context, session *client.Session, rewardIDs []string) ([]*domain.RewardRedemption, error)
}

type twitchRewardService struct {
	sqlDB             storage.RelationalStorage
	twitchHelixClient clients.TwitchHelixClient
	twitchAuthService TwitchAuthService
}

func NewTwitchRewardService(sqlDB storage.RelationalStorage, twitchHelixClient clients.TwitchHelixClient, twitchAuthService TwitchAuthService) TwitchRewardService {
	return &twitchRewardService{
		sqlDB:             sqlDB,
		twitchHelixClient: twitchHelixClient,
		twitchAuthService: twitchAuthService,
	}
}

func (s *twitchRewardService) GetAvailableTwitchRewards(ctx context.Context, session *client.Session) ([]*helix.ChannelCustomReward, error) {
	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return nil, model.NewForbiddenError("Failed to get identity ID", err)
	}

	auth, err := s.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err != nil {
		return nil, model.NewForbiddenError("Failed to get auth", err)
	}

	helixRewards, err := s.twitchHelixClient.GetCustomRewards(ctx, auth)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get custom rewards", err)
	}

	return helixRewards, nil
}

func (s *twitchRewardService) GetExistingTwitchRewardsRedemptions(ctx context.Context, session *client.Session, rewardIDs []string) ([]*domain.RewardRedemption, error) {
	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return nil, model.NewForbiddenError("Failed to get identity ID", err)
	}

	auth, err := s.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err != nil {
		return nil, model.NewForbiddenError("Failed to get auth", err)
	}

	var wg sync.WaitGroup

	wg.Add(len(rewardIDs))

	redemptionMap := sync.Map{}

	for _, rewardID := range rewardIDs {
		go func() {
			defer wg.Done()
			redemptions, err := s.twitchHelixClient.GetCustomRewardRedemptions(ctx, auth, rewardID)
			if err != nil {
				logger.Errorf(ctx, "Failed to get custom reward redemptions: %v", err)
				return
			}

			for _, redemption := range redemptions {
				redemptionMap.Store(rewardID, redemption)
			}
		}()
	}

	wg.Wait()

	result := make([]*domain.RewardRedemption, 0)

	redemptionMap.Range(func(key, value any) bool {
		redemption := value.(*helix.ChannelCustomRewardsRedemption)

		result = append(result, &domain.RewardRedemption{
			ID:               redemption.ID,
			BroadcasterID:    redemption.BroadcasterID,
			BroadcasterLogin: redemption.BroadcasterLogin,
			BroadcasterName:  redemption.BroadcasterName,
			UserID:           redemption.UserID,
			UserName:         redemption.UserName,
			UserLogin:        redemption.UserLogin,
			UserInput:        redemption.UserInput,
			Status:           redemption.Status,
			RedeemedAt:       redemption.RedeemedAt.Time,
			Reward: &domain.ChannelReward{
				ID: key.(string),
			},
		})
		return false
	})

	return result, nil
}
