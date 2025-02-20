package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ContentNoteReactionService interface {
	AddContentNoteReaction(ctx context.Context, category db.ContentCategory, contentNoteID uuid.UUID, emoteID string, source string) error
	RemoveContentNoteReaction(ctx context.Context, category db.ContentCategory, contentNoteID uuid.UUID, emoteID string, source string) error
	GetContentNoteReactionsByContentNoteIdsAndUserId(ctx context.Context, category db.ContentCategory, contentNoteIDs uuid.UUIDs, userID uuid.UUID) ([]*models.ReactionStack, error)
}

type contentNoteReactionService struct {
	sqlDB storage.RelationalStorage
}

func NewContentNoteReactionService(sqlDB storage.RelationalStorage) ContentNoteReactionService {
	return &contentNoteReactionService{sqlDB: sqlDB}
}

func (s *contentNoteReactionService) AddContentNoteReaction(ctx context.Context, category db.ContentCategory, noteID uuid.UUID, emoteID string, source string) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to get user ID", err)
	}

	if source == "unicode_emoji" && len(emoteID) > 16 {
		return errors.NewBadRequestError("unicode emoji must be 16 characters or less", nil)
	}

	count, err := s.sqlDB.CountNoteReactionsByNoteIDAndUserID(ctx, category, noteID, authUserID)
	if err != nil {
		return errors.NewInternalServerError("failed to count content note reactions", err)
	}

	if count >= 3 {
		return errors.NewBadRequestError("user has reached the maximum number of reactions", nil)
	}

	reaction := &models.Reaction{
		ContentNoteID: noteID,
		UserID:        authUserID,
		EmoteID:       emoteID,
		Source:        db.ReactionSource(source),
	}
	err = s.sqlDB.InsertContentNoteReaction(ctx, category, reaction, authUserID)

	if err != nil {
		return errors.NewInternalServerError("failed to add content note reaction", err)
	}

	return nil
}

func (s *contentNoteReactionService) RemoveContentNoteReaction(ctx context.Context, category db.ContentCategory, contentNoteID uuid.UUID, emoteID string, source string) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to get user ID", err)
	}

	reaction := &models.Reaction{
		ContentNoteID: contentNoteID,
		UserID:        authUserID,
		EmoteID:       emoteID,
		Source:        db.ReactionSource(source),
	}
	err = s.sqlDB.DeleteContentNoteReaction(ctx, category, reaction)
	if err != nil {
		return errors.NewInternalServerError("failed to remove content note reaction", err)
	}
	return nil
}

func (s *contentNoteReactionService) GetContentNoteReactionsByContentNoteIdsAndUserId(ctx context.Context, category db.ContentCategory, contentNoteIDs uuid.UUIDs, userID uuid.UUID) ([]*models.ReactionStack, error) {
	reactions, err := s.sqlDB.FindContentNoteReactionsByContentNoteIdsAndUserId(ctx, category, contentNoteIDs, userID)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get content note reactions", err)
	}
	return reactions, nil
}
