package service

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

type TwitchAuthService interface {
	CreateTwitchAuthorization(ctx context.Context, identityID uuid.UUID, auth *model.TwitchAuth) (*db.TwitchAuthorization, error)
	GetAuthByBroadcasterID(ctx context.Context, broadcasterID string) (*db.TwitchAuthorization, error)
	GetAuthByIdentityID(ctx context.Context, identityID uuid.UUID) (*db.TwitchAuthorization, error)
}

type twitchAuthService struct {
	sqlDB  storage.RelationalStorage
	oryAPI clients.OryAPI
}

func NewTwitchAuthService(sqlDB storage.RelationalStorage, oryAPI clients.OryAPI) TwitchAuthService {
	return &twitchAuthService{
		sqlDB:  sqlDB,
		oryAPI: oryAPI,
	}
}

func (s *twitchAuthService) CreateTwitchAuthorization(ctx context.Context, identityID uuid.UUID, auth *model.TwitchAuth) (*db.TwitchAuthorization, error) {
	authorization, err := s.sqlDB.Queries().InsertTwitchAuthorization(ctx, db.InsertTwitchAuthorizationParams{
		IdentityID:    identityID,
		BroadcasterID: auth.BroadcasterID,
		AccessToken:   auth.AccessToken,
		RefreshToken:  auth.RefreshToken,
		ExpiresAt:     auth.ExpiresIn,
	})
	if err != nil {
		return nil, err
	}
	return authorization, nil
}

func (s *twitchAuthService) GetAuthByBroadcasterID(ctx context.Context, broadcasterID string) (*db.TwitchAuthorization, error) {
	authorization, err := s.sqlDB.Queries().FindTwitchAuthorizationByBroadcasterID(ctx, broadcasterID)
	if err != nil {
		return nil, err
	}
	return authorization, nil
}

func (s *twitchAuthService) GetAuthByIdentityID(ctx context.Context, identityID uuid.UUID) (*db.TwitchAuthorization, error) {
	authorization, err := s.sqlDB.Queries().FindTwitchAuthorizationByIdentityID(ctx, identityID)
	if err != nil {
		return nil, err
	}
	return authorization, nil
}
