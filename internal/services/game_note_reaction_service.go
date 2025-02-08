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
	GetGameNoteReactionsByGameNoteIdsAndUserId(ctx context.Context, gameNoteIDs []uuid.UUID, userID uuid.UUID) ([]*db.GetGameNoteReactionsByGameNoteIdInAndUserIdRow, error)
}

type gameNoteReactionService struct {
	sqlDB storage.RelationalStorage
}

func NewGameNoteReactionService(sqlDB storage.RelationalStorage) GameNoteReactionService {
	return &gameNoteReactionService{sqlDB: sqlDB}
}

func (s *gameNoteReactionService) AddGameNoteReaction(ctx context.Context, gameNoteID uuid.UUID, userID uuid.UUID, emoteID string, source string) error {
	// validate emote id
	if emoteID == "" {
		return errors.NewBadRequestError("emote id is required", nil)
	}

	// validate source
	if source == "" {
		return errors.NewBadRequestError("source is required", nil)
	} else if source != "unicode_emoji" {
		return errors.NewBadRequestError("invalid source", nil)
	}

	if source == "unicode_emoji" && len(emoteID) > 16 {
		return errors.NewBadRequestError("unicode emoji must be 16 characters or less", nil)
	}

	count, err := s.sqlDB.Queries().CountGameNoteReactionsByGameNoteIdAndUserId(ctx, db.CountGameNoteReactionsByGameNoteIdAndUserIdParams{
		GameNoteID: gameNoteID,
		UserID:     userID,
	})
	if err != nil {
		return errors.NewInternalServerError("failed to count game note reactions by game note id and user id", err)
	}

	if count >= 3 {
		return errors.NewBadRequestError("user has reached the maximum number of reactions", nil)
	}

	err = s.sqlDB.Queries().AddGameNoteReaction(ctx, db.AddGameNoteReactionParams{
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

func (s *gameNoteReactionService) GetGameNoteReactionsByGameNoteIdsAndUserId(ctx context.Context, gameNoteIDs []uuid.UUID, userID uuid.UUID) ([]*db.GetGameNoteReactionsByGameNoteIdInAndUserIdRow, error) {
	rows, err := s.sqlDB.Queries().GetGameNoteReactionsByGameNoteIdInAndUserId(ctx, db.GetGameNoteReactionsByGameNoteIdInAndUserIdParams{
		Column1: gameNoteIDs,
		UserID:  userID,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get game note reactions by game note id and user id", err)
	}
	return rows, nil
}
