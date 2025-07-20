package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/nicklaw5/helix/v2"
	"github.com/ory/client-go"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

type BroadcasterService interface {
	GetBroadcasterPreferences(ctx context.Context, session *client.Session) (*model.BroadcasterPreferences, error)
	SaveBroadcasterPreferences(ctx context.Context, session *client.Session, req *model.BroadcasterPreferencesRequest) error
	GetBroadcasterTrackedRewards(ctx context.Context, broadcasterID string) (map[string]string, error)
}

type broadcasterService struct {
	sqlDB               storage.RelationalStorage
	oryAPI              clients.OryAPI
	twitchAuthService   TwitchAuthService
	eventsubService     EventsubService
	twitchRewardService TwitchRewardService
}

func NewBroadcasterService(sqlDB storage.RelationalStorage, oryAPI clients.OryAPI, twitchAuthService TwitchAuthService, eventsubService EventsubService, twitchRewardService TwitchRewardService) BroadcasterService {
	return &broadcasterService{
		sqlDB:               sqlDB,
		oryAPI:              oryAPI,
		twitchAuthService:   twitchAuthService,
		eventsubService:     eventsubService,
		twitchRewardService: twitchRewardService,
	}
}

func (s *broadcasterService) GetBroadcasterPreferences(ctx context.Context, session *client.Session) (*model.BroadcasterPreferences, error) {
	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return nil, model.NewForbiddenError("Failed to get identity ID", err)
	}

	auth, err := s.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get auth", err)
	}

	subscriptions, err := s.eventsubService.GetActiveSubscriptionsByEventType(ctx, helix.EventSubTypeChannelPointsCustomRewardRedemptionAdd, identityID)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	helixRewards, err := s.twitchRewardService.GetAvailableTwitchRewards(ctx, session)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	trackedRewardIDs, err := s.GetBroadcasterTrackedRewards(ctx, auth.BroadcasterID)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	availableRewards := make([]*model.ChannelReward, 0)
	trackedRewards := make([]*model.ChannelReward, 0)

	for _, reward := range helixRewards {
		rewardModel := &model.ChannelReward{
			ID:                  reward.ID,
			Title:               reward.Title,
			Prompt:              reward.Prompt,
			BackgroundColor:     reward.BackgroundColor,
			Cost:                reward.Cost,
			IsEnabled:           reward.IsEnabled,
			IsPaused:            reward.IsPaused,
			IsInStock:           reward.IsInStock,
			IsUserInputRequired: reward.IsUserInputRequired,
			Category:            trackedRewardIDs[reward.ID],
		}

		if _, ok := trackedRewardIDs[reward.ID]; ok {
			trackedRewards = append(trackedRewards, rewardModel)
		} else if reward.IsUserInputRequired {
			availableRewards = append(availableRewards, rewardModel)
		}
	}

	isRewardTrackingActive := len(subscriptions) > 0
	rewardsPreferences := model.RewardsPreferences{
		TrackedRewards:   trackedRewards,
		AvailableRewards: availableRewards,
		TrackingEnabled:  isRewardTrackingActive,
		IsActive:         isRewardTrackingActive,
	}

	return &model.BroadcasterPreferences{Rewards: rewardsPreferences}, nil
}

func (s *broadcasterService) GetBroadcasterTrackedRewards(ctx context.Context, broadcasterID string) (map[string]string, error) {
	trackedRewards, err := s.sqlDB.Queries().FindTrackedRewardsByBroadcasterID(ctx, broadcasterID)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	trackedRewardIDs := make(map[string]string)
	for _, trackedReward := range trackedRewards {
		trackedRewardIDs[trackedReward.TrackedRewardID] = trackedReward.Category
	}

	return trackedRewardIDs, nil
}

func (s *broadcasterService) SaveBroadcasterPreferences(ctx context.Context, session *client.Session, req *model.BroadcasterPreferencesRequest) error {
	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return model.NewForbiddenError("Failed to get identity ID", err)
	}

	auth, err := s.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err != nil {
		return model.NewInternalServerError("Failed to get auth", err)
	}

	helixRewards, err := s.twitchRewardService.GetAvailableTwitchRewards(ctx, session)
	if err != nil {
		return model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	trackedRewardIDs, err := s.GetBroadcasterTrackedRewards(ctx, auth.BroadcasterID)
	if err != nil {
		return model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	availableRewardIDs := make([]string, 0)
	for _, reward := range helixRewards {
		if reward.IsUserInputRequired {
			availableRewardIDs = append(availableRewardIDs, reward.ID)
		}
	}

	trackedRewardIDsToDelete := make([]string, 0)
	trackedRewards := make([]db.InsertTrackedRewardParams, 0)

	for _, rewardReq := range req.Rewards.TrackedRewards {
		trackedRewards = append(trackedRewards, db.InsertTrackedRewardParams{
			BroadcasterID:   auth.BroadcasterID,
			TrackedRewardID: rewardReq.RewardID,
			Category:        rewardReq.Category,
			UpdatedBy:       identityID,
		})
	}

	for _, reward := range req.Rewards.TrackedRewards {
		if _, ok := trackedRewardIDs[reward.RewardID]; !ok {
			trackedRewardIDsToDelete = append(trackedRewardIDsToDelete, reward.RewardID)
		}
	}

	tx, err := s.sqlDB.Begin(ctx)
	if err != nil {
		return model.NewInternalServerError("Failed to begin transaction", err)
	}

	qtx := s.sqlDB.Queries().WithTx(tx)
	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		} else {
			tx.Commit(ctx)
		}
	}()

	if len(trackedRewardIDsToDelete) > 0 {
		err = qtx.DeleteTrackedRewardsByBroadcasterID(ctx, db.DeleteTrackedRewardsByBroadcasterIDParams{
			BroadcasterID:    auth.BroadcasterID,
			TrackedRewardIds: trackedRewardIDsToDelete,
		})
		if err != nil {
			return model.NewInternalServerError("Failed to delete tracked rewards", err)
		}
	}

	if len(trackedRewards) > 0 {
		for _, trackedReward := range trackedRewards {
			err = qtx.InsertTrackedReward(ctx, trackedReward)
			if err != nil {
				return model.NewInternalServerError("Failed to insert tracked rewards", err)
			}
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return model.NewInternalServerError("Failed to commit transaction", err)
	}

	return nil
}
