package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/nicklaw5/helix/v2"
	"github.com/ory/client-go"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

type TwitchRewardService interface {
	GetAvailableTwitchRewards(ctx context.Context, session *client.Session) ([]helix.ChannelCustomReward, error)
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

func (s *twitchRewardService) GetAvailableTwitchRewards(ctx context.Context, session *client.Session) ([]helix.ChannelCustomReward, error) {
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
