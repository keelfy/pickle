package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"
)

type ContentNoteService interface {
	// write operations
	CreateContentNote(ctx context.Context, qtx sql.Queries, content domain.IDetailedContent, orderer *domain.Orderer, params commands.ICreateContentNoteCommand) (domain.IDetailedContentNote, error)
	UpdateContentNoteByID(ctx context.Context, cmd commands.IUpdateContentNoteCommand) error
	DeleteContentNoteByID(ctx context.Context, cmd *commands.DeleteContentNoteCommand) error

	// read operations
	CheckIfContentNoteExistsByContentID(ctx context.Context, contentID uuid.UUID, category domain.ContentCategory) (bool, error)
	GetContentNoteByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory) (domain.IContentNote, error)
	GetContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID) (domain.IContentNote, error)
	GetDetailedContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID) (domain.IDetailedContentNote, error)
	GetDetailedNoteByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory) (domain.IDetailedContentNote, error)
	GetFilteredSortedByReceiverID(ctx context.Context, cmd *commands.GetSortedContentNotesByUserIDCommand) ([]domain.IDetailedContentNote, error)
	CountPlayedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	CountWatchedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	CountOrdersByContentNoteID(ctx context.Context, category domain.ContentCategory, noteID uuid.UUID) (int64, error)
}

type contentNoteService struct {
	sqlDB             storage.RelationalStorage
	elastic           storage.ElasticStorage
	cache             storage.CacheStorage
	posterService     PosterService
	permissionService PermissionService
	ordererService    OrdererService
	contentService    ContentService
	userService       UserService
	countPlayedSFG    singleflight.Group
	countWatchedSFG   singleflight.Group
	logger            *zap.SugaredLogger
}

func NewContentNoteService(
	sqlDB storage.RelationalStorage,
	elastic storage.ElasticStorage,
	cache storage.CacheStorage,
	posterService PosterService,
	ordererService OrdererService,
	permissionService PermissionService,
	contentService ContentService,
	userService UserService, zapLogger *zap.SugaredLogger,
) ContentNoteService {
	return &contentNoteService{
		sqlDB:             sqlDB,
		elastic:           elastic,
		cache:             cache,
		posterService:     posterService,
		permissionService: permissionService,
		ordererService:    ordererService,
		contentService:    contentService,
		userService:       userService,
		countPlayedSFG:    singleflight.Group{},
		countWatchedSFG:   singleflight.Group{}, logger: zapLogger,
	}
}

func (s *contentNoteService) CreateContentNote(ctx context.Context, qtx sql.Queries, content domain.IDetailedContent, orderer *domain.Orderer, params commands.ICreateContentNoteCommand) (domain.IDetailedContentNote, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get user id from context", err)
	}

	contentNoteBase := &domain.DetailedContentNote{
		ContentNote: &domain.ContentNote{
			Content: content,
		},
		OrdererCount: 1,
	}

	var contentNote domain.IDetailedContentNote

	switch params := params.(type) {
	case *commands.CreateGameNoteCommand:
		status := domain.GameNoteStatusPlanned
		if params.Status != nil {
			status = *params.Status
		}

		gameNote, err := qtx.InsertGameNote(ctx, sql.InsertGameNoteParams{
			CreatedBy:        authUserID,
			UserID:           params.UserID,
			Status:           status,
			Rate:             params.Rate,
			Comment:          params.Comment,
			LastPlayedAt:     params.LastPlayedAt,
			InitialOrdererID: orderer.ID,
			ContentID:        content.GetID(),
		})
		if err != nil {
			return nil, utils.NewInternalServerError("failed to insert game note", err)
		}

		contentNoteBase.ID = gameNote.ID
		contentNoteBase.UserID = gameNote.UserID
		contentNoteBase.InitialOrdererID = gameNote.InitialOrdererID
		contentNoteBase.Rate = gameNote.Rate
		contentNoteBase.Comment = gameNote.Comment
		contentNoteBase.CreatedAt = gameNote.CreatedAt
		contentNoteBase.UpdatedAt = gameNote.UpdatedAt
		contentNote = &domain.DetailedGameNote{
			DetailedContentNote: contentNoteBase,
			Status:              gameNote.Status,
			LastPlayedAt:        gameNote.LastPlayedAt,
		}
	case *commands.CreateMovieNoteCommand:
		status := domain.MovieNoteStatusPlanned
		if params.Status != nil {
			status = *params.Status
		}

		note, err := qtx.InsertMovieNote(ctx, sql.InsertMovieNoteParams{
			CreatedBy:        authUserID,
			UserID:           params.UserID,
			Rate:             params.Rate,
			Comment:          params.Comment,
			Status:           status,
			WatchedAt:        params.WatchedAt,
			InitialOrdererID: orderer.ID,
			ContentID:        content.GetID(),
		})
		if err != nil {
			return nil, utils.NewInternalServerError("failed to insert movie note", err)
		}

		contentNoteBase.ID = note.ID
		contentNoteBase.UserID = note.UserID
		contentNoteBase.InitialOrdererID = note.InitialOrdererID
		contentNoteBase.Rate = note.Rate
		contentNoteBase.Comment = note.Comment
		contentNoteBase.CreatedAt = note.CreatedAt
		contentNoteBase.UpdatedAt = note.UpdatedAt
		contentNote = &domain.DetailedMovieNote{
			DetailedContentNote: contentNoteBase,
			Status:              note.Status,
			WatchedAt:           note.WatchedAt,
		}
	case *commands.CreateContentNoteCommand:
		var newCmd commands.ICreateContentNoteCommand
		switch params.Category {
		case domain.ContentCategoryGames:
			newCmd = &commands.CreateGameNoteCommand{
				CreateContentNoteCommand: params,
			}
		case domain.ContentCategoryMovies:
			newCmd = &commands.CreateMovieNoteCommand{
				CreateContentNoteCommand: params,
			}
		}
		return s.CreateContentNote(ctx, qtx, content, orderer, newCmd)
	default:
		return nil, utils.NewInternalServerError("invalid command type", nil)
	}

	return contentNote, nil
}

func (s *contentNoteService) CheckIfContentNoteExistsByContentID(ctx context.Context, contentID uuid.UUID, category domain.ContentCategory) (bool, error) {
	alreadyExists, err := s.sqlDB.Queries().CheckIfContentNoteExistsByContentID(ctx, category, contentID)
	if err != nil {
		return false, utils.NewInternalServerError("failed to check if content note already exists", err)
	}
	return alreadyExists, nil
}

func (s *contentNoteService) GetContentNoteByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory) (domain.IContentNote, error) {
	locale, ok := ctx.Value(middleware.LocaleCtxKey).(string)
	if !ok {
		return nil, utils.NewInternalServerError("locale not found in context", nil)
	}

	contentNote, err := s.sqlDB.Queries().FindContentNoteByID(ctx, category, id, locale)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("content note not found", nil)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to find content note by id", err)
	}

	return contentNote, nil
}

func (s *contentNoteService) GetContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID) (domain.IContentNote, error) {
	locale := utils.GetLocaleFromCtx(ctx)
	contentNote, err := s.sqlDB.Queries().FindContentNoteByContentID(ctx, category, contentID, userID, locale)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("content note not found", nil)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to find content note by content id", err)
	}

	return contentNote, nil
}

func (s *contentNoteService) GetDetailedContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID) (domain.IDetailedContentNote, error) {
	locale := utils.GetLocaleFromCtx(ctx)
	contentNote, err := s.sqlDB.Queries().FindDetailedContentNoteByContentID(ctx, category, contentID, userID, locale)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("content note not found", nil)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to find content note by content id", err)
	}

	return contentNote, nil
}

func (s *contentNoteService) GetDetailedNoteByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory) (domain.IDetailedContentNote, error) {
	locale, ok := ctx.Value(middleware.LocaleCtxKey).(string)
	if !ok {
		return nil, utils.NewInternalServerError("locale not found in context", nil)
	}

	note, err := s.sqlDB.Queries().FindDetailedContentNoteByID(ctx, id, category, locale)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("content note not found", nil)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to find detailed content note by id", err)
	}
	return note, nil
}

func (s *contentNoteService) UpdateContentNoteByID(ctx context.Context, cmd commands.IUpdateContentNoteCommand) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return err
	}

	comment := ""
	if cmd.GetComment() != "" {
		comment = cmd.GetComment()
	}

	switch v := cmd.(type) {
	case *commands.GameNoteUpdateCommand:
		status := domain.GameNoteStatusPlanned
		if v.Status != nil {
			status = *v.Status
		}

		err = s.sqlDB.Queries().UpdateGameNoteByID(ctx, sql.UpdateGameNoteByIDParams{
			ID:           cmd.GetID(),
			UpdatedBy:    authUserID,
			Status:       status,
			Rate:         v.Rate,
			Comment:      &comment,
			LastPlayedAt: v.LastPlayedAt,
		})
		if err != nil {
			return utils.NewInternalServerError("failed to update game note by id", err)
		}
	case *commands.MovieNoteUpdateCommand:
		status := domain.MovieNoteStatusPlanned
		if v.Status != nil {
			status = *v.Status
		}

		err = s.sqlDB.Queries().UpdateMovieNoteByID(ctx, sql.UpdateMovieNoteByIDParams{
			ID:        cmd.GetID(),
			UpdatedBy: authUserID,
			Status:    status,
			Rate:      v.Rate,
			Comment:   &comment,
			WatchedAt: v.WatchedAt,
		})
		if err != nil {
			return utils.NewInternalServerError("failed to update movie note by id", err)
		}
	default:
		return errors.New("invalid content type")
	}
	return nil
}

func (s *contentNoteService) DeleteContentNoteByID(ctx context.Context, cmd *commands.DeleteContentNoteCommand) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return err
	}

	return s.sqlDB.BeginTx(ctx, func(qtx sql.Queries) error {
		if cmd.ResetApprovedOrders {
			err = qtx.CancelOrderDecisionsByContentNoteID(ctx, sql.CancelOrderDecisionsByContentNoteIDParams{
				ContentNoteID:       cmd.ID,
				ContentNoteCategory: cmd.Category,
				DeletedBy:           authUserID,
			})
			if err != nil {
				return utils.NewInternalServerError("failed to cancel order decisions", err)
			}
		}

		err = qtx.DeleteContentNoteByID(ctx, cmd.Category, cmd.ID)
		if err != nil {
			return utils.NewInternalServerError("failed to delete content note", err)
		}

		return nil
	})
}

func (s *contentNoteService) GetFilteredSortedByReceiverID(ctx context.Context, cmd *commands.GetSortedContentNotesByUserIDCommand) ([]domain.IDetailedContentNote, error) {
	locale := utils.GetLocaleFromCtx(ctx)

	contentNotes, err := s.sqlDB.Queries().FindPaginatedContentNotesByUserID(ctx, sql.FindPaginatedContentNotesByUserIDParams{
		Category: cmd.Category,
		UserID:   cmd.UserID,
		Sort:     cmd.Sort,
		Filters:  cmd.Filters,
		Locale:   locale,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to find paginated content notes by user id", err)
	}
	return contentNotes, nil
}

func (s *contentNoteService) CountPlayedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	cacheKey := fmt.Sprintf("played_content_count:%s", userID)
	counts, err := s.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return counts, nil
	}

	value, err, _ := s.countPlayedSFG.Do(cacheKey, func() (any, error) {
		count, err := s.sqlDB.Queries().CountPlayedGameNotesByUserID(ctx, userID)
		if err != nil {
			return 0, utils.NewInternalServerError("failed to count played game notes by user id", err)
		}

		err = s.cache.SetKey(ctx, cacheKey, count, time.Hour*24)
		if err != nil {
			return 0, utils.NewInternalServerError("failed to count played game notes by user id", err)
		}

		return count, nil
	})

	count, err := utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, utils.NewInternalServerError("failed to count played game notes by user id", err)
	}
	return count, nil
}

func (s *contentNoteService) CountWatchedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	cacheKey := fmt.Sprintf("watched_content_count:%s", userID)
	counts, err := s.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return counts, nil
	}

	value, err, _ := s.countWatchedSFG.Do(cacheKey, func() (any, error) {
		count, err := s.sqlDB.Queries().CountWatchedMovieNotesByUserID(ctx, userID)
		if err != nil {
			return 0, utils.NewInternalServerError("failed to count watched movie notes by user id", err)
		}

		err = s.cache.SetKey(ctx, cacheKey, count, time.Hour*24)
		if err != nil {
			return 0, utils.NewInternalServerError("failed to count watched movie notes by user id", err)
		}
		return count, nil
	})

	count, err := utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, utils.NewInternalServerError("failed to count watched movie notes by user id", err)
	}
	return count, nil
}

func (s *contentNoteService) CountOrdersByContentNoteID(ctx context.Context, category domain.ContentCategory, noteID uuid.UUID) (int64, error) {
	counts, err := s.sqlDB.Queries().CountOrdersByContentNoteIDAndCategory(ctx, category, noteID)
	if err != nil {
		return 0, utils.NewInternalServerError("failed to count orders by content note id", err)
	}
	return counts, nil
}
