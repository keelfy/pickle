package services

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	cerrors "github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
)

type GameService interface {
	GetGameByIDWithLocalization(ctx context.Context, id uuid.UUID, lang string) (*models.Game, error)
	GetGameByID(ctx context.Context, id uuid.UUID) (*db.Game, error)
}

type gameService struct {
	sqlDB storage.RelationalStorage
}

func NewGameService(sqlDB storage.RelationalStorage) GameService {
	return &gameService{
		sqlDB: sqlDB,
	}
}

func (s *gameService) GetGameByID(ctx context.Context, id uuid.UUID) (*db.Game, error) {
	game, err := s.sqlDB.Queries().FindGameByID(ctx, id)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during game fetching", err)
	}
	return game, nil
}

func (s *gameService) GetGameByIDWithLocalization(ctx context.Context, id uuid.UUID, lang string) (*models.Game, error) {
	game, err := s.sqlDB.Queries().FindGameByIDWithLocalization(ctx, db.FindGameByIDWithLocalizationParams{
		ID:   id,
		Lang: db.Locale(lang),
	})
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during game fetching", err)
	}

	var websites *[]models.ContentWebsite
	if game.Websites != nil {
		if err := json.Unmarshal(*game.Websites, &websites); err != nil {
			return nil, cerrors.NewInternalServerError("Error occurred during game fetching", err)
		}
	}

	return &models.Game{
		ID:           game.ID,
		ExternalID:   game.ExternalID,
		Title:        game.Title,
		ReleaseDate:  game.ReleaseDate,
		Websites:     websites,
		CoverKey:     game.CoverKey,
		CoverKeyType: game.CoverKeyType,
		SourceURL:    game.SourceUrl,
		SourceType:   game.SourceType,
	}, nil
}
