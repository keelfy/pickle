package services

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/nicklaw5/helix/v2"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type TwitchService interface {
	GetTwitchAuthorizationURL(ctx context.Context, state string) (string, error)
	ExchangeTwitchCodeForToken(ctx context.Context, code string) (*helix.AccessCredentials, error)
	GetTwitchHelixUser(ctx context.Context, token string) (*helix.User, error)
	CreateTwitchConnection(ctx context.Context, twitchConnection *db.TwitchConnection) error
	GetTwitchConnectionByOwnerID(ctx context.Context, userID uuid.UUID) (string, error)
	GenerateAuthState(ctx context.Context, userID string) string
	ParseAuthState(ctx context.Context, state string) (uuid.UUID, bool)
}

type twitchService struct {
	sqlDB             storage.RelationalStorage
	twitchHelixClient clients.TwitchHelixClient
}

func NewTwitchService(sqlDB storage.RelationalStorage, twitchHelixClient clients.TwitchHelixClient) TwitchService {
	return &twitchService{sqlDB: sqlDB, twitchHelixClient: twitchHelixClient}
}

var (
	authStateSecret = config.GetTwitchAuthStateSecret()
)

func (s *twitchService) GetTwitchAuthorizationURL(ctx context.Context, state string) (string, error) {
	url, err := s.twitchHelixClient.GetAuthorizationURL(ctx, state)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred during twitch authorization url fetch", err)
	}
	return url, nil
}

func (s *twitchService) ExchangeTwitchCodeForToken(ctx context.Context, code string) (*helix.AccessCredentials, error) {
	token, err := s.twitchHelixClient.RequestUserAccessToken(ctx, code)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during twitch token exchange", err)
	}

	return token, nil
}

func (s *twitchService) GetTwitchHelixUser(ctx context.Context, token string) (*helix.User, error) {
	user, err := s.twitchHelixClient.GetHelixUser(ctx, token)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during twitch user info fetch", err)
	}

	return user, nil
}

func (s *twitchService) CreateTwitchConnection(ctx context.Context, twitchConnection *db.TwitchConnection) error {
	err := s.sqlDB.Queries().CreateTwitchConnection(ctx, db.CreateTwitchConnectionParams{
		OwnerID:       twitchConnection.OwnerID,
		BroadcasterID: twitchConnection.BroadcasterID,
		Login:         twitchConnection.Login,
		AccessToken:   twitchConnection.AccessToken,
		RefreshToken:  twitchConnection.RefreshToken,
		ExpiresAt:     twitchConnection.ExpiresAt,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred during twitch connection creation", err)
	}

	return nil
}

func (s *twitchService) GetTwitchConnectionByOwnerID(ctx context.Context, userID uuid.UUID) (string, error) {
	login, err := s.sqlDB.Queries().GetTwitchConnectionByOwnerID(ctx, userID)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred during twitch connection fetch", err)
	}

	return login, nil
}

func (s *twitchService) GenerateAuthState(ctx context.Context, userID string) string {
	payload := fmt.Sprintf("%s:%d", userID, time.Now().Unix())
	mac := hmac.New(sha256.New, authStateSecret)
	mac.Write([]byte(payload))
	signature := base64.URLEncoding.EncodeToString(mac.Sum(nil))
	return base64.URLEncoding.EncodeToString([]byte(payload + ":" + signature))
}

func (s *twitchService) ParseAuthState(ctx context.Context, state string) (uuid.UUID, bool) {
	decoded, err := base64.URLEncoding.DecodeString(state)
	if err != nil {
		return uuid.Nil, false
	}

	parts := strings.Split(string(decoded), ":")
	if len(parts) != 3 {
		return uuid.Nil, false
	}

	payload := parts[0] + ":" + parts[1]
	signature := parts[2]

	mac := hmac.New(sha256.New, authStateSecret)
	mac.Write([]byte(payload))
	if !hmac.Equal([]byte(signature), mac.Sum(nil)) {
		return uuid.Nil, false
	}

	userID, err := utils.ParseUUIDFromString(parts[0])
	if err != nil {
		return uuid.Nil, false
	}

	return userID, true
}
