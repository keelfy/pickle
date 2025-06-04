package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/models"
)

type ConnectionService interface {
	GetConnections(ctx context.Context, userID uuid.UUID) (*models.Connections, error)
}

type connectionService struct {
	twitchService TwitchService
}

func NewConnectionService(
	twitchService TwitchService,
) ConnectionService {
	return &connectionService{
		twitchService: twitchService,
	}
}

func (s *connectionService) GetConnections(ctx context.Context, userID uuid.UUID) (*models.Connections, error) {
	twitchConnection, err := s.twitchService.GetTwitchConnectionByOwnerID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &models.Connections{
		Twitch: models.TwitchConnection{
			Connected: twitchConnection != "",
			Login:     twitchConnection,
		},
	}, nil
}
