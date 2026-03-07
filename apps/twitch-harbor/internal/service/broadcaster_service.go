package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/ory/client-go"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/domain"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

type BroadcasterService interface {
	SaveBroadcasterPreferences(ctx context.Context, session *client.Session, req *model.BroadcasterPreferencesRequest) error
	GetBroadcasterTrackedRewards(ctx context.Context, broadcasterID string) ([]*domain.TrackedReward, error)
}

type broadcasterService struct {
	sqlDB               storage.RelationalStorage
	oryAPI              clients.OryAPI
	twitchAuthService   TwitchAuthService
	eventsubService     EventsubService
	twitchRewardService TwitchRewardService
}

func NewBroadcasterService(
	sqlDB storage.RelationalStorage,
	oryAPI clients.OryAPI,
	twitchAuthService TwitchAuthService,
	eventsubService EventsubService,
	twitchRewardService TwitchRewardService,
) BroadcasterService {
	return &broadcasterService{
		sqlDB:               sqlDB,
		oryAPI:              oryAPI,
		twitchAuthService:   twitchAuthService,
		eventsubService:     eventsubService,
		twitchRewardService: twitchRewardService,
	}
}

func (s *broadcasterService) GetBroadcasterTrackedRewards(ctx context.Context, broadcasterID string) ([]*domain.TrackedReward, error) {
	trackedRewards, err := s.sqlDB.Queries().FindTrackedRewardsByBroadcasterID(ctx, broadcasterID)
	if err != nil {
		return nil, model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	rewards := make([]*domain.TrackedReward, len(trackedRewards))

	for i, trackedReward := range trackedRewards {
		rewards[i] = &domain.TrackedReward{
			BroadcasterID: trackedReward.BroadcasterID,
			RewardID:      trackedReward.TrackedRewardID,
			Category:      trackedReward.Category,
			CreatedAt:     trackedReward.CreatedAt,
			UpdatedAt:     trackedReward.UpdatedAt,
			UpdatedBy:     trackedReward.UpdatedBy,
		}
	}

	return rewards, nil
}

func (s *broadcasterService) SaveBroadcasterPreferences(ctx context.Context, session *client.Session, req *model.BroadcasterPreferencesRequest) error {
	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return model.NewForbiddenError("Failed to get identity ID", err)
	}

	auth, err := s.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err == pgx.ErrNoRows {
		return model.NewNotFoundError("broadcaster not found", err)
	} else if err != nil {
		return model.NewInternalServerError("failed to get auth", err)
	}

	availableRewards, err := s.twitchRewardService.GetAvailableTwitchRewards(ctx, session)
	if err != nil {
		return model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	trackedRewards, err := s.GetBroadcasterTrackedRewards(ctx, auth.BroadcasterID)
	if err != nil {
		return model.NewInternalServerError("Failed to get broadcaster preferences", err)
	}

	availableRewardIDs := make([]string, 0)
	for _, reward := range availableRewards {
		if reward.IsUserInputRequired {
			availableRewardIDs = append(availableRewardIDs, reward.ID)
		}
	}

	trackedRewardsToInsert := make([]db.InsertTrackedRewardParams, 0)
	for _, rewardReq := range req.Rewards.TrackedRewards {
		trackedRewardsToInsert = append(trackedRewardsToInsert, db.InsertTrackedRewardParams{
			BroadcasterID:   auth.BroadcasterID,
			TrackedRewardID: rewardReq.RewardID,
			Category:        rewardReq.Category,
			UpdatedBy:       identityID,
		})
	}

	trackedRewardIDsToDelete := make([]string, 0)

	for _, trackedReward := range trackedRewards {
		found := false
		for _, reward := range req.Rewards.TrackedRewards {
			if trackedReward.RewardID == reward.RewardID {
				found = true
				break
			}
		}

		if !found {
			trackedRewardIDsToDelete = append(trackedRewardIDsToDelete, trackedReward.RewardID)
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

	for _, trackedReward := range trackedRewardsToInsert {
		err = qtx.InsertTrackedReward(ctx, trackedReward)
		if err != nil {
			return model.NewInternalServerError("Failed to insert tracked rewards", err)
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return model.NewInternalServerError("Failed to commit transaction", err)
	}

	return nil
}
