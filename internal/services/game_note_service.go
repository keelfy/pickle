package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"golang.org/x/sync/errgroup"
)

type GameNoteService interface {
	GetById(ctx context.Context, id uuid.UUID) (*db.GameNote, error)
	GetByReceiverId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.FindPaginatedGameNotesByUserIdRow, error)
	CreateOrderedGameNote(ctx context.Context, userId uuid.UUID, initialOrder *db.Order, initialOrderer *db.Orderer, title string) (*db.GameNote, error)
	CreateGameNote(ctx context.Context, userID, creatorID uuid.UUID, req *types.GameNoteReq) (*db.GameNote, error)
	IndexGameNote(ctx context.Context, gameNote *db.GameNote, initialOrderer *db.Orderer) error
	CountPlayedByUserId(ctx context.Context, userID uuid.UUID) (int64, error)
	DeleteGameNoteById(ctx context.Context, id uuid.UUID, initiatorID uuid.UUID, resetApprovedOrders bool) error
	UpdateGameNoteById(ctx context.Context, id uuid.UUID, req *types.GameNoteReq, initiatorID uuid.UUID) error
}

type gameNoteService struct {
	sqlDb                storage.RelationalStorage
	elastic              storage.ElasticStorage
	cache                storage.CacheStorage
	userService          ProfileService
	ordererService       OrdererService
	gameNoteOrderService GameNoteOrderService
	posterService        PosterService
}

func NewGameNoteService(
	sqlDb storage.RelationalStorage, elastic storage.ElasticStorage, cache storage.CacheStorage,
	userService ProfileService, ordererService OrdererService,
	gameNoteOrderService GameNoteOrderService, posterService PosterService,
) GameNoteService {
	return &gameNoteService{
		sqlDb:                sqlDb,
		elastic:              elastic,
		cache:                cache,
		userService:          userService,
		ordererService:       ordererService,
		gameNoteOrderService: gameNoteOrderService,
		posterService:        posterService,
	}
}

func (service *gameNoteService) GetById(ctx context.Context, id uuid.UUID) (*db.GameNote, error) {
	gameNote, err := service.sqlDb.Queries().FindGameNoteById(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Game note not found", err)
	}
	return gameNote, nil
}

// Fetches game notes by receiver ID or returns CustomError if error occurred
func (service *gameNoteService) GetByReceiverId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.FindPaginatedGameNotesByUserIdRow, error) {
	gameNotes, err := service.sqlDb.FindPaginatedGameNotesByUserId(ctx, userID, sort)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game notes fetching", err)
	}

	return gameNotes, nil
}

// Creates game note and initial order (or approves existing) using user
// Validated inputs is expected
func (service *gameNoteService) CreateOrderedGameNote(ctx context.Context, userId uuid.UUID, initialOrder *db.Order, initialOrderer *db.Orderer, title string) (*db.GameNote, error) {
	// validation
	if len(userId) == 0 {
		return nil, errors.NewUnauthorizedError("Receiver ID is required", nil)
	} else if len(title) == 0 {
		return nil, errors.NewBadRequestError("Name of the note is required", nil)
	}

	gameNote, err := service.sqlDb.Queries().InsertGameNote(ctx, db.InsertGameNoteParams{
		CreatedBy:        userId,
		UpdatedBy:        userId,
		UserID:           initialOrder.ReceiverID,
		Name:             title,
		InitialOrdererID: initialOrderer.ID,
		Status:           db.GameNoteStatusPlanned,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game note creation", err)
	}

	var g errgroup.Group

	g.Go(func() error {
		return service.gameNoteOrderService.CreateGameNoteOrder(ctx, userId, initialOrder.ID, gameNote.ID)
	})

	g.Go(func() error {
		return service.IndexGameNote(ctx, gameNote, initialOrderer)
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return gameNote, nil
}

func (service *gameNoteService) CreateGameNote(ctx context.Context, userID, creatorID uuid.UUID, req *types.GameNoteReq) (*db.GameNote, error) {
	// TODO: moderators should be able to create game notes for other users
	if userID != creatorID {
		return nil, errors.NewForbiddenError("You are not allowed to create a game note for another user", nil)
	}

	var (
		posterKey *string
		err       error
	)

	if req.Poster != nil && req.Poster.PreviewID != nil {
		posterPreviewId := *req.Poster.PreviewID
		posterKey, err = service.posterService.ConfirmS3PosterPreviewByID(ctx, posterPreviewId, "game-note")
		if err != nil {
			return nil, err
		}
	}

	gameNote, err := service.sqlDb.Queries().InsertGameNote(ctx, db.InsertGameNoteParams{
		CreatedBy:    creatorID,
		UpdatedBy:    creatorID,
		UserID:       userID,
		Name:         req.Name,
		Status:       req.Status,
		Link:         req.Link,
		ReleaseDate:  req.ReleaseDate,
		Rate:         req.Rate,
		Comment:      req.Comment,
		LastPlayedAt: req.LastPlayedAt,
		PosterKey:    posterKey,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game note creation", err)
	}

	err = service.IndexGameNote(ctx, gameNote, nil)
	if err != nil {
		return nil, err
	}

	return gameNote, nil
}

func (service *gameNoteService) IndexGameNote(ctx context.Context, gameNote *db.GameNote, initialOrderer *db.Orderer) error {
	var g errgroup.Group

	g.Go(func() error {
		return service.elastic.IndexContent(ctx, gameNote.ID, gameNote.Name, gameNote.UserID, db.ContentCategoryGames)
	})

	g.Go(func() error {
		document := &types.EsGameNote{
			ID:          gameNote.ID,
			Name:        gameNote.Name,
			UserID:      gameNote.UserID,
			OrdererName: initialOrderer.Username,
			RequestDate: gameNote.CreatedAt,
			Status:      gameNote.Status,
		}
		_, err := service.elastic.IndexDocument(ctx, "game_notes", gameNote.ID.String(), document)
		return err
	})

	if err := g.Wait(); err != nil {
		return errors.NewInternalServerError("Error occurred during game note indexing", err)
	}
	return nil
}

func (service *gameNoteService) CountPlayedByUserId(ctx context.Context, userID uuid.UUID) (int64, error) {
	counts, err := service.sqlDb.Queries().CountPlayedGameNotesByUserId(ctx, userID)
	if err != nil {
		return 0, errors.NewInternalServerError("Error occurred during game notes counting", err)
	}

	return counts, nil
}

func (service *gameNoteService) DeleteGameNoteById(ctx context.Context, id uuid.UUID, initiatorID uuid.UUID, resetApprovedOrders bool) error {
	gameNote, err := service.GetById(ctx, id)
	if err != nil {
		return err
	}

	if gameNote.UserID != initiatorID {
		return errors.NewForbiddenError("You are not allowed to delete this game note", nil)
	}

	// Start transaction
	tx, err := service.sqlDb.Begin(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error starting transaction", err)
	}
	defer tx.Rollback(ctx)

	qtx := service.sqlDb.Queries().WithTx(tx)

	if resetApprovedOrders {
		err = qtx.ResetApprovedOrdersByGameNoteId(ctx, id)
		if err != nil {
			return errors.NewInternalServerError("Error occurred during orders reset", err)
		}
	}

	err = qtx.DeleteGameNoteById(ctx, id)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during game note deletion", err)
	}

	// Commit transaction
	err = tx.Commit(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error committing transaction", err)
	}

	var g errgroup.Group

	g.Go(func() error {
		return service.elastic.DeleteContentNoteByID(ctx, "game_notes", gameNote.ID)
	})

	g.Go(func() error {
		return service.elastic.DeleteContent(ctx, gameNote.ID, db.ContentCategoryGames)
	})

	if err := g.Wait(); err != nil {
		logger.Errorf(ctx, "[ELASTIC] Error deleting game note: %v", err)
	}

	return nil
}

func (service *gameNoteService) UpdateGameNoteById(ctx context.Context, id uuid.UUID, req *types.GameNoteReq, initiatorID uuid.UUID) error {
	gameNote, err := service.GetById(ctx, id)
	if err != nil {
		return err
	}

	if gameNote.UserID != initiatorID {
		return errors.NewForbiddenError("You are not allowed to update this game note", nil)
	}

	var posterKey *string

	if req.Poster != nil && req.Poster.PreviewID != nil {
		posterPreviewId := *req.Poster.PreviewID
		posterKey, err = service.posterService.ConfirmS3PosterPreviewByID(ctx, posterPreviewId, "game-note")
		if err != nil {
			return err
		}
	}

	err = service.sqlDb.Queries().UpdateGameNoteById(ctx, db.UpdateGameNoteByIdParams{
		ID:           id,
		UpdatedBy:    initiatorID,
		Name:         req.Name,
		Link:         req.Link,
		ReleaseDate:  req.ReleaseDate,
		Rate:         req.Rate,
		Comment:      req.Comment,
		Status:       req.Status,
		LastPlayedAt: req.LastPlayedAt,
		PosterKey:    posterKey,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred during game note update", err)
	}

	// delete old poster key if it was updated
	if gameNote.PosterKey != nil && *gameNote.PosterKey != *posterKey {
		err = service.posterService.DeletePosterKey(ctx, "game-note", *gameNote.PosterKey)
		if err != nil {
			return err
		}
	}

	err = service.IndexGameNote(ctx, gameNote, nil)
	if err != nil {
		return err
	}

	return nil
}
