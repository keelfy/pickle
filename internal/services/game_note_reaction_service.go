package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
)

type GameNoteReactionService interface {
	AddGameNoteReaction(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID, emoteID string, source string) error
	RemoveGameNoteReaction(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID, emoteID string, source string) error
	GetGameNoteReactionsByGameNoteIdAndUserId(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID) ([]*db.GetGameNoteReactionsByGameNoteIdAndUserIdRow, error)
	GetGameNoteReactionsByGameNoteId(ctx context.Context, gameNoteID uuid.UUID) ([]*db.GetGameNoteReactionsByGameNoteIdRow, error)
}

type gameNoteReactionService struct {
	sqlDB storage.RelationalStorage
}

func NewGameNoteReactionService(sqlDB storage.RelationalStorage) GameNoteReactionService {
	return &gameNoteReactionService{sqlDB: sqlDB}
}

func (s *gameNoteReactionService) AddGameNoteReaction(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID, emoteID string, source string) error {
	err := s.sqlDB.Queries().AddGameNoteReaction(ctx, db.AddGameNoteReactionParams{
		GameNoteID: gameNoteID,
		UserID:     userID,
		EmoteID:    emoteID,
		Source:     db.ReactionSource(source),
		CreatedBy:  userID,
	})
	if err != nil {
		return errors.NewInternalServerError("failed to add game note reaction", err)
	}
	return nil
}

func (s *gameNoteReactionService) RemoveGameNoteReaction(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID, emoteID string, source string) error {
	err := s.sqlDB.Queries().RemoveGameNoteReaction(ctx, db.RemoveGameNoteReactionParams{
		GameNoteID: gameNoteID,
		UserID:     userID,
		EmoteID:    emoteID,
		Source:     db.ReactionSource(source),
	})
	if err != nil {
		return errors.NewInternalServerError("failed to remove game note reaction", err)
	}
	return nil
}

func (s *gameNoteReactionService) GetGameNoteReactionsByGameNoteIdAndUserId(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID) ([]*db.GetGameNoteReactionsByGameNoteIdAndUserIdRow, error) {
	rows, err := s.sqlDB.Queries().GetGameNoteReactionsByGameNoteIdAndUserId(ctx, db.GetGameNoteReactionsByGameNoteIdAndUserIdParams{
		GameNoteID: gameNoteID,
		UserID:     userID,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get game note reactions by game note id and user id", err)
	}
	return rows, nil
}

func (s *gameNoteReactionService) GetGameNoteReactionsByGameNoteId(ctx context.Context, gameNoteID uuid.UUID) ([]*db.GetGameNoteReactionsByGameNoteIdRow, error) {
	rows, err := s.sqlDB.Queries().GetGameNoteReactionsByGameNoteId(ctx, gameNoteID)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get game note reactions by game note id", err)
	}

	return rows, nil
}
