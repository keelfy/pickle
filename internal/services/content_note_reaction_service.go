package services

import (
	"context"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ContentNoteReactionService interface {
	AddContentNoteReaction(ctx context.Context, cmd *commands.AddContentNoteReactionCommand) error
	RemoveContentNoteReaction(ctx context.Context, cmd *commands.RemoveContentNoteReactionCommand) error
	GetContentNoteReactions(ctx context.Context, cmd *commands.GetContentNoteReactionsBatchCommand) ([]*domain.ContentNoteReactionStack, error)
}

type contentNoteReactionService struct {
	sqlDB storage.RelationalStorage
}

func NewContentNoteReactionService(sqlDB storage.RelationalStorage) ContentNoteReactionService {
	return &contentNoteReactionService{sqlDB: sqlDB}
}

func (s *contentNoteReactionService) AddContentNoteReaction(ctx context.Context, cmd *commands.AddContentNoteReactionCommand) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return utils.NewInternalServerError("failed to get user ID", err)
	}

	count, err := s.sqlDB.Queries().CountReactionsByContentNoteIDAndUserID(ctx, cmd.Category, cmd.ContentNoteID, authUserID)
	if err != nil {
		return utils.NewInternalServerError("failed to count content note reactions", err)
	}

	if count >= 3 {
		return utils.NewBadRequestError("user has reached the maximum number of reactions", nil)
	}

	err = s.sqlDB.Queries().InsertContentNoteReaction(ctx, cmd.Category, &sql.InsertContentNoteReactionParams{
		ContentNoteID: cmd.ContentNoteID,
		EmoteID:       cmd.EmoteID,
		Source:        cmd.Source,
		CreatedBy:     authUserID,
	})
	if err != nil {
		return utils.NewInternalServerError("failed to add content note reaction", err)
	}

	return nil
}

func (s *contentNoteReactionService) RemoveContentNoteReaction(ctx context.Context, cmd *commands.RemoveContentNoteReactionCommand) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return utils.NewInternalServerError("failed to get user ID", err)
	}

	err = s.sqlDB.Queries().DeleteContentNoteReaction(ctx, cmd.Category, &sql.DeleteContentNoteReactionParams{
		ContentNoteID: cmd.ContentNoteID,
		EmoteID:       cmd.EmoteID,
		Source:        cmd.Source,
		UserID:        authUserID,
	})
	if err != nil {
		return utils.NewInternalServerError("failed to remove content note reaction", err)
	}
	return nil
}

func (s *contentNoteReactionService) GetContentNoteReactions(ctx context.Context, cmd *commands.GetContentNoteReactionsBatchCommand) ([]*domain.ContentNoteReactionStack, error) {
	requesterUserID := utils.GetUserIDFromContextOrNil(ctx)

	reactions, err := s.sqlDB.Queries().FindReactionsByContentNoteIDsInAndRequesterUserID(ctx, cmd.Category, cmd.ContentNoteIDs, requesterUserID)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get content note reactions", err)
	}
	return reactions, nil
}
