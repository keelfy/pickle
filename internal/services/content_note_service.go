package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	cerrors "github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/models/requests"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"
)

type ContentNoteService interface {
	// create operations
	CreateOrderedContentNote(ctx context.Context, contentType db.ContentCategory, order *db.Order, orderer *db.Orderer, title string, initiatorID uuid.UUID) (uuid.UUID, error)
	CreateContentNote(ctx context.Context, category db.ContentCategory, userID, creatorID uuid.UUID, req requests.CreateContentNoteReq) (models.ContentNote, error)

	// order-related operations
	AttachOrderToContentNote(ctx context.Context, order *db.Order, contentID uuid.UUID, category db.ContentCategory, initiatorID uuid.UUID) error
	AttachOrderToContentNoteWithTx(ctx context.Context, qtx *db.Queries, order *db.Order, contentID uuid.UUID, category db.ContentCategory, initiatorID uuid.UUID) error

	// posters
	GetContentNotePosterImageURL(ctx context.Context, category db.ContentCategory, size, imageKey string, cbTime time.Time) (string, error)
	GetContentNotePosterImageURL1(ctx context.Context, size string, content models.ContentNote) (string, error)

	// read operations
	GetContentNoteByID(ctx context.Context, id uuid.UUID, category db.ContentCategory) (models.ContentNote, error)
	CountPlayedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	CountWatchedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error)
	CountOrdersByContentNoteID(ctx context.Context, category db.ContentCategory, noteID uuid.UUID) (int64, error)
	GetFilteredSortedByReceiverID(ctx context.Context, category db.ContentCategory, userID uuid.UUID, sort *types.CursorSort, filters types.Filters) ([]models.ContentNoteSearchResult, error)

	// elastic operations
	IndexContentNote(ctx context.Context, contentNote models.ContentNote, initialOrderer *db.Orderer) error

	// update operations
	UpdateContentNoteByID(ctx context.Context, id uuid.UUID, category db.ContentCategory, updatedNote requests.CreateContentNoteReq) error
	UpdateContentNoteName(ctx context.Context, id uuid.UUID, category db.ContentCategory, name string) error

	// delete operations
	DeleteContentNoteByID(ctx context.Context, id uuid.UUID, category db.ContentCategory, resetApprovedOrders bool) error
}

type contentNoteService struct {
	sqlDB             storage.RelationalStorage
	elastic           storage.ElasticStorage
	cache             storage.CacheStorage
	posterService     PosterService
	permissionService PermissionService
	ordererService    OrdererService
	profileService    ProfileService
	countPlayedSFG    singleflight.Group
	countWatchedSFG   singleflight.Group
}

func NewContentService(
	sqlDB storage.RelationalStorage, elastic storage.ElasticStorage, cache storage.CacheStorage,
	posterService PosterService, ordererService OrdererService, permissionService PermissionService,
	profileService ProfileService,
) ContentNoteService {
	return &contentNoteService{
		sqlDB:             sqlDB,
		elastic:           elastic,
		cache:             cache,
		posterService:     posterService,
		permissionService: permissionService,
		ordererService:    ordererService,
		profileService:    profileService,
		countPlayedSFG:    singleflight.Group{},
		countWatchedSFG:   singleflight.Group{},
	}
}

func (service *contentNoteService) getContentCategoryPrefix(contentType db.ContentCategory) (string, error) {
	switch contentType {
	case db.ContentCategoryGames:
		return "game-note", nil
	case db.ContentCategoryMovies:
		return "movie-note", nil
	case db.ContentCategoryAnime:
		return "anime-note", nil
	case db.ContentCategorySeries:
		return "series-note", nil
	case db.ContentCategoryVideo:
		return "video-note", nil
	}
	return "", errors.New("invalid content type")
}

func (s *contentNoteService) CreateContentNote(ctx context.Context, category db.ContentCategory, userID, creatorID uuid.UUID, req requests.CreateContentNoteReq) (models.ContentNote, error) {
	hasPermission, err := s.permissionService.HasPermission(ctx, userID, creatorID, types.ModeratorPermission)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during permission check", err)
	}

	if !hasPermission {
		return nil, cerrors.NewForbiddenError("You are not allowed to create a content note for this user", nil)
	}

	var posterKey *string
	if req.GetPosterPreviewID() != nil && *req.GetPosterPreviewID() != uuid.Nil {
		prefix, err := s.getContentCategoryPrefix(category)
		if err != nil {
			return nil, err
		}

		posterKey, err = s.posterService.ConfirmS3PosterPreviewByID(ctx, *req.GetPosterPreviewID(), prefix)
		if err != nil {
			return nil, err
		}
	}

	creator, err := s.profileService.GetProfileById(ctx, creatorID)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during creator fetching", err)
	}

	tx, err := s.sqlDB.Begin(ctx)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during transaction creation", err)
	}
	defer tx.Rollback(ctx)
	qtx := s.sqlDB.Queries().WithTx(tx)

	initialOrderer, err := s.ordererService.CreateOrdererWithTx(ctx, qtx, creator.Username, creator, false)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during initial orderer creation", err)
	}

	var contentNote models.ContentNote
	switch v := req.(type) {
	case *requests.CreateGameNoteReq:
		gameNote, err := qtx.InsertGameNote(ctx, db.InsertGameNoteParams{
			CreatedBy:        creatorID,
			UserID:           userID,
			Name:             v.Name,
			Status:           v.Status,
			Link:             v.Link,
			ReleaseDate:      v.ReleaseDate,
			Rate:             v.Rate,
			Comment:          v.Comment,
			LastPlayedAt:     v.LastPlayedAt,
			PosterKey:        posterKey,
			InitialOrdererID: initialOrderer.ID,
		})
		if err != nil {
			return nil, cerrors.NewInternalServerError("Error occurred during game note creation", err)
		}
		contentNote = &models.GameNote{GameNote: *gameNote}
	case *requests.CreateMovieNoteReq:
		movieNote, err := qtx.InsertMovieNote(ctx, db.InsertMovieNoteParams{
			CreatedBy:        creatorID,
			UserID:           userID,
			Name:             v.Name,
			ReleaseDate:      v.ReleaseDate,
			Rate:             v.Rate,
			Comment:          v.Comment,
			Status:           v.Status,
			WatchedAt:        v.WatchedAt,
			PosterKey:        posterKey,
			InitialOrdererID: initialOrderer.ID,
		})
		if err != nil {
			return nil, cerrors.NewInternalServerError("Error occurred during movie note creation", err)
		}
		contentNote = &models.MovieNote{MovieNote: *movieNote}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during transaction commit", err)
	}

	err = s.IndexContentNote(ctx, contentNote, initialOrderer)
	if err != nil {
		return nil, err
	}

	return contentNote, nil
}

func (service *contentNoteService) CreateOrderedContentNote(ctx context.Context, contentType db.ContentCategory, order *db.Order, orderer *db.Orderer, title string, initiatorID uuid.UUID) (uuid.UUID, error) {
	var contentNote models.ContentNote

	tx, err := service.sqlDB.Begin(ctx)
	if err != nil {
		return uuid.Nil, cerrors.NewInternalServerError("Error occurred during transaction creation", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.sqlDB.Queries().WithTx(tx)

	switch contentType {
	case db.ContentCategoryGames:
		gameNote, err := qtx.InsertGameNote(ctx, db.InsertGameNoteParams{
			CreatedBy:        initiatorID,
			UserID:           order.ReceiverID,
			Name:             title,
			InitialOrdererID: orderer.ID,
			Status:           db.GameNoteStatusPlanned,
		})
		if err != nil {
			return uuid.Nil, cerrors.NewInternalServerError("Error occurred during game note creation", err)
		}
		contentNote = &models.GameNote{GameNote: *gameNote}
	case db.ContentCategoryMovies:
		movieNote, err := qtx.InsertMovieNote(ctx, db.InsertMovieNoteParams{
			CreatedBy:        initiatorID,
			UserID:           order.ReceiverID,
			Name:             title,
			InitialOrdererID: orderer.ID,
			Status:           db.MovieNoteStatusPlanned,
		})
		if err != nil {
			return uuid.Nil, cerrors.NewInternalServerError("Error occurred during movie note creation", err)
		}
		contentNote = &models.MovieNote{MovieNote: *movieNote}
	}

	var g errgroup.Group

	g.Go(func() error {
		return service.AttachOrderToContentNoteWithTx(ctx, qtx, order, contentNote.GetID(), contentType, initiatorID)
	})

	g.Go(func() error {
		return service.IndexContentNote(ctx, contentNote, orderer)
	})

	if err := g.Wait(); err != nil {
		return uuid.Nil, err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return uuid.Nil, cerrors.NewInternalServerError("Error occurred during transaction commit", err)
	}

	return contentNote.GetID(), nil
}

func (service *contentNoteService) AttachOrderToContentNote(ctx context.Context, order *db.Order, contentID uuid.UUID, category db.ContentCategory, initiatorID uuid.UUID) error {
	return service.AttachOrderToContentNoteWithTx(ctx, service.sqlDB.Queries(), order, contentID, category, initiatorID)
}

func (service *contentNoteService) AttachOrderToContentNoteWithTx(ctx context.Context, qtx *db.Queries, order *db.Order, contentID uuid.UUID, category db.ContentCategory, initiatorID uuid.UUID) error {
	switch category {
	case db.ContentCategoryGames:
		_, err := qtx.InsertGameNoteOrder(ctx, db.InsertGameNoteOrderParams{
			OrderID:    order.ID,
			GameNoteID: contentID,
			CreatedBy:  initiatorID,
			UpdatedBy:  initiatorID,
		})
		if err != nil {
			return err
		}
		return nil
	case db.ContentCategoryMovies:
		_, err := qtx.InsertMovieNoteOrder(ctx, db.InsertMovieNoteOrderParams{
			OrderID:     order.ID,
			MovieNoteID: contentID,
			CreatedBy:   initiatorID,
		})
		if err != nil {
			return err
		}
		return nil
	}

	return errors.New("invalid content type")
}

func (service *contentNoteService) GetContentNotePosterImageURL(ctx context.Context, category db.ContentCategory, size, imageKey string, cbTime time.Time) (string, error) {
	prefix, err := service.getContentCategoryPrefix(category)
	if err != nil {
		return "", err
	}
	return service.posterService.GetPosterImageURL(ctx, prefix, size, imageKey, cbTime)
}

func (service *contentNoteService) GetContentNotePosterImageURL1(ctx context.Context, size string, content models.ContentNote) (string, error) {
	if content.GetPosterKey() == nil {
		return "", nil
	}

	prefix, err := service.getContentCategoryPrefix(content.GetCategory())
	if err != nil {
		return "", err
	}

	return service.posterService.GetPosterImageURL(ctx, prefix, size, *content.GetPosterKey(), content.GetPosterUpdatedAt())
}

func (service *contentNoteService) GetContentNoteByID(ctx context.Context, id uuid.UUID, category db.ContentCategory) (models.ContentNote, error) {
	switch category {
	case db.ContentCategoryGames:
		gameNote, err := service.sqlDB.Queries().FindGameNoteById(ctx, id)
		if err != nil {
			return nil, cerrors.NewInternalServerError("Error occurred during game note fetching", err)
		}
		return &models.GameNote{GameNote: *gameNote}, nil
	case db.ContentCategoryMovies:
		movieNote, err := service.sqlDB.Queries().FindMovieNoteById(ctx, id)
		if err != nil {
			return nil, cerrors.NewInternalServerError("Error occurred during movie note fetching", err)
		}
		return &models.MovieNote{MovieNote: *movieNote}, nil
	default:
		return nil, errors.New("invalid content type")
	}
}

func (service *contentNoteService) IndexContentNote(ctx context.Context, contentNote models.ContentNote, initialOrderer *db.Orderer) error {
	var g errgroup.Group

	g.Go(func() error {
		return service.elastic.IndexContent(ctx, contentNote.GetID(), contentNote.GetName(), contentNote.GetUserID(), contentNote.GetCategory())
	})

	g.Go(func() error {
		switch contentNote.GetCategory() {
		case db.ContentCategoryGames:
			document := &types.EsGameNote{
				ID:          contentNote.GetID(),
				Name:        contentNote.GetName(),
				UserID:      contentNote.GetUserID(),
				OrdererName: initialOrderer.Username,
				RequestDate: contentNote.GetCreatedAt(),
				Status:      db.GameNoteStatus(contentNote.GetStatus()),
			}
			_, err := service.elastic.IndexDocument(ctx, "game_notes", contentNote.GetID().String(), document)
			return err
			// case db.ContentCategoryMovies:
			// 	document := &types.EsMovieNote{
			// 		ID:          contentNote.GetID(),
			// 		Name:        contentNote.GetName(),
			// 		UserID:      contentNote.GetUserID(),
			// 		OrdererName: initialOrderer.Username,
			// 		RequestDate: contentNote.GetCreatedAt(),
			// 		Status:      db.MovieNoteStatus(contentNote.GetStatus()),
			// 	}
			// 	_, err := service.elastic.IndexDocument(ctx, "movie_notes", contentNote.GetID().String(), document)
			// 	return err
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return cerrors.NewInternalServerError("Error occurred during game note indexing", err)
	}
	return nil
}

func (service *contentNoteService) UpdateContentNoteByID(ctx context.Context, id uuid.UUID, category db.ContentCategory, updatedNote requests.CreateContentNoteReq) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred during user ID extraction", err)
	}

	contentNote, err := service.GetContentNoteByID(ctx, id, category)
	if err != nil {
		return err
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, contentNote.GetUserID(), authUserID, types.ModeratorPermission)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred during permission check", err)
	}

	if !hasPermission {
		return cerrors.NewForbiddenError("You are not allowed to update this game note", nil)
	}

	prefix, err := service.getContentCategoryPrefix(category)
	if err != nil {
		return err
	}

	posterKey := contentNote.GetPosterKey()
	if updatedNote.GetPosterPreviewID() != nil && *updatedNote.GetPosterPreviewID() != uuid.Nil {
		posterKey, err = service.posterService.ConfirmS3PosterPreviewByID(ctx, *updatedNote.GetPosterPreviewID(), prefix)
		if err != nil {
			return err
		}
	}

	switch v := updatedNote.(type) {
	case *requests.CreateGameNoteReq:
		err = service.sqlDB.Queries().UpdateGameNoteById(ctx, db.UpdateGameNoteByIdParams{
			ID:           id,
			UpdatedBy:    authUserID,
			PosterKey:    posterKey,
			Name:         v.Name,
			Status:       db.GameNoteStatus(v.Status),
			Link:         v.Link,
			ReleaseDate:  v.ReleaseDate,
			Rate:         v.Rate,
			Comment:      v.Comment,
			LastPlayedAt: v.LastPlayedAt,
		})
		if err != nil {
			return cerrors.NewInternalServerError("Error occurred during game note update", err)
		}
	case *requests.CreateMovieNoteReq:
		err = service.sqlDB.Queries().UpdateMovieNoteById(ctx, db.UpdateMovieNoteByIdParams{
			ID:          id,
			UpdatedBy:   authUserID,
			PosterKey:   posterKey,
			Name:        v.Name,
			Status:      db.MovieNoteStatus(v.Status),
			ReleaseDate: v.ReleaseDate,
			Rate:        v.Rate,
			Comment:     v.Comment,
			WatchedAt:   v.WatchedAt,
		})
		if err != nil {
			return cerrors.NewInternalServerError("Error occurred during movie note update", err)
		}
	default:
		return errors.New("invalid content type")
	}

	// delete old poster key if it was updated
	if contentNote.GetPosterKey() != nil && posterKey != nil && *contentNote.GetPosterKey() != *posterKey {
		err = service.posterService.DeletePosterKey(ctx, prefix, *contentNote.GetPosterKey())
		if err != nil {
			return err
		}
	}

	orderer, err := service.ordererService.GetOrdererById(ctx, contentNote.GetInitialOrdererID())
	if err != nil {
		return err
	}

	err = service.IndexContentNote(ctx, contentNote, orderer)
	if err != nil {
		return err
	}

	return nil
}

func (service *contentNoteService) UpdateContentNoteName(ctx context.Context, id uuid.UUID, category db.ContentCategory, name string) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred during user ID extraction", err)
	}

	var contentNote models.ContentNote

	switch category {
	case db.ContentCategoryGames:
		gameNote, err := service.sqlDB.Queries().UpdateGameNoteName(ctx, db.UpdateGameNoteNameParams{
			ID:        id,
			UpdatedBy: authUserID,
			Name:      name,
		})
		if err != nil {
			return cerrors.NewInternalServerError("Error occurred during game note name update", err)
		}
		contentNote = &models.GameNote{GameNote: *gameNote}
	case db.ContentCategoryMovies:
		movieNote, err := service.sqlDB.Queries().UpdateMovieNoteName(ctx, db.UpdateMovieNoteNameParams{
			ID:        id,
			UpdatedBy: authUserID,
			Name:      name,
		})
		if err != nil {
			return cerrors.NewInternalServerError("Error occurred during movie note name update", err)
		}
		contentNote = &models.MovieNote{MovieNote: *movieNote}
	default:
		return errors.New("invalid content type")
	}

	err = service.IndexContentNote(ctx, contentNote, nil)
	if err != nil {
		return err
	}

	return nil
}

func (service *contentNoteService) DeleteContentNoteByID(ctx context.Context, id uuid.UUID, category db.ContentCategory, resetApprovedOrders bool) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred during user ID extraction", err)
	}

	contentNote, err := service.GetContentNoteByID(ctx, id, category)
	if err != nil {
		return err
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, contentNote.GetUserID(), authUserID, types.ModeratorPermission)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred during permission check", err)
	}

	if !hasPermission {
		return cerrors.NewForbiddenError("You are not allowed to delete this game note", nil)
	}

	tx, err := service.sqlDB.Begin(ctx)
	if err != nil {
		return cerrors.NewInternalServerError("Error starting transaction", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.sqlDB.Queries().WithTx(tx)

	if resetApprovedOrders {
		switch category {
		case db.ContentCategoryGames:
			err = qtx.ResetApprovedOrdersByGameNoteId(ctx, id)
			if err != nil {
				return cerrors.NewInternalServerError("Error occurred during orders reset", err)
			}
		case db.ContentCategoryMovies:
			err = qtx.ResetApprovedOrdersByMovieNoteId(ctx, id)
			if err != nil {
				return cerrors.NewInternalServerError("Error occurred during orders reset", err)
			}
		}
	}

	switch category {
	case db.ContentCategoryGames:
		err = qtx.DeleteGameNoteById(ctx, id)
		if err != nil {
			return cerrors.NewInternalServerError("Error occurred during game note deletion", err)
		}
	case db.ContentCategoryMovies:
		err = qtx.DeleteMovieNoteById(ctx, id)
		if err != nil {
			return cerrors.NewInternalServerError("Error occurred during movie note deletion", err)
		}
	}

	// Commit transaction
	err = tx.Commit(ctx)
	if err != nil {
		return cerrors.NewInternalServerError("Error committing transaction", err)
	}

	var g errgroup.Group

	g.Go(func() error {
		return service.elastic.DeleteContentNoteByID(ctx, category, id)
	})

	g.Go(func() error {
		return service.elastic.DeleteContent(ctx, id, category)
	})

	if err := g.Wait(); err != nil {
		logger.Errorf(ctx, "[ELASTIC] Error deleting content note: %v", err)
	}

	return nil
}

func (service *contentNoteService) CountPlayedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	cacheKey := fmt.Sprintf("played_content_count:%s", userID)
	counts, err := service.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return counts, nil
	}

	value, err, _ := service.countPlayedSFG.Do(cacheKey, func() (any, error) {
		count, err := service.sqlDB.Queries().CountPlayedGameNotesByUserId(ctx, userID)
		if err != nil {
			return 0, cerrors.NewInternalServerError("Error occurred during game notes counting", err)
		}

		err = service.cache.SetKey(ctx, cacheKey, count, time.Hour*24)
		if err != nil {
			return 0, cerrors.NewInternalServerError("Error occurred during game notes counting", err)
		}

		return count, nil
	})

	count, err := utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, cerrors.NewInternalServerError("Error occurred during game notes counting", err)
	}
	return count, nil
}

func (service *contentNoteService) CountWatchedContentByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	cacheKey := fmt.Sprintf("watched_content_count:%s", userID)
	counts, err := service.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return counts, nil
	}

	value, err, _ := service.countWatchedSFG.Do(cacheKey, func() (any, error) {
		count, err := service.sqlDB.Queries().CountWatchedMovieNotesByUserId(ctx, userID)
		if err != nil {
			return 0, cerrors.NewInternalServerError("Error occurred during movie notes counting", err)
		}

		err = service.cache.SetKey(ctx, cacheKey, count, time.Hour*24)
		if err != nil {
			return 0, cerrors.NewInternalServerError("Error occurred during movie notes counting", err)
		}
		return count, nil
	})

	count, err := utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, cerrors.NewInternalServerError("Error occurred during movie notes counting", err)
	}
	return count, nil
}

func (service *contentNoteService) GetFilteredSortedByReceiverID(ctx context.Context, category db.ContentCategory, userID uuid.UUID, sort *types.CursorSort, filters types.Filters) ([]models.ContentNoteSearchResult, error) {
	contentNotes, err := service.sqlDB.FindPaginatedContentNotesByUserID(ctx, category, userID, sort, filters)
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred during game notes fetching", err)
	}
	return contentNotes, nil
}

func (service *contentNoteService) CountOrdersByContentNoteID(ctx context.Context, category db.ContentCategory, noteID uuid.UUID) (int64, error) {
	var counts int64
	var err error

	switch category {
	case db.ContentCategoryGames:
		counts, err = service.sqlDB.Queries().CountOrdersByGameNoteId(ctx, noteID)
	case db.ContentCategoryMovies:
		counts, err = service.sqlDB.Queries().CountOrdersByMovieNoteId(ctx, noteID)
	}

	if err != nil {
		return 0, cerrors.NewInternalServerError("Error occurred during orders counting", err)
	}

	return counts, nil
}
