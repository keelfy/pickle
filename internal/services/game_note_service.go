package services

import (
	"context"
	"fmt"

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
	GetByReceiverId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.GameNote, error)
	CreateGameNote(ctx context.Context, req *types.CreateGameNoteReq, userId uuid.UUID) (*db.GameNote, error)
	ValidateCreateGameNote(req *types.CreateGameNoteReq, userId uuid.UUID) error
	IndexGameNote(ctx context.Context, gameNote *db.GameNote, initialOrderer *db.Orderer) error
}

type gameNoteService struct {
	sqlDb                storage.SQLDatabase
	elastic              storage.ElasticClient
	cache                storage.CacheClient
	orderService         OrderService
	userService          ProfileService
	ordererService       OrdererService
	contentService       ContentService
	gameNoteOrderService GameNoteOrderService
	posterService        PosterService
}

func NewGameNoteService(
	sqlDb storage.SQLDatabase, elastic storage.ElasticClient, cache storage.CacheClient,
	orderService OrderService, userService ProfileService, ordererService OrdererService,
	contentService ContentService, gameNoteOrderService GameNoteOrderService, posterService PosterService,
) GameNoteService {
	return &gameNoteService{
		sqlDb:                sqlDb,
		elastic:              elastic,
		cache:                cache,
		orderService:         orderService,
		userService:          userService,
		ordererService:       ordererService,
		contentService:       contentService,
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
func (service *gameNoteService) GetByReceiverId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.GameNote, error) {
	gameNotes, err := service.sqlDb.FindPaginatedGameNotesByUserId(ctx, userID, sort)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game notes fetching", err)
	}

	return gameNotes, nil
}

// Creates game note and initial order (or approves existing) using user
// Validated inputs is expected
func (service *gameNoteService) CreateGameNote(ctx context.Context, req *types.CreateGameNoteReq, userId uuid.UUID) (*db.GameNote, error) {
	initialOrder, err := service.orderService.GetOrderById(ctx, req.InitialOrderID)
	if err != nil {
		return nil, err
	}

	initialOrderer, err := service.ordererService.GetOrdererById(ctx, initialOrder.OrdererID)
	if err != nil {
		return nil, err
	}

	order, err := service.orderService.UpdateOrderStatus(ctx, initialOrder, db.OrderStatusApproved, userId)
	if err != nil {
		return nil, err
	}

	var posterKey *string

	if req.Poster != nil && req.Poster.PreviewID != nil {
		posterPreviewId := *req.Poster.PreviewID
		posterKey, err = service.posterService.ConfirmS3PosterPreviewByID(ctx, posterPreviewId, "game-note")
		if err != nil {
			return nil, err
		}
	}

	// Insert new game note into database
	// TODO: Data validation before insertion, e.g. min-max rating or release date not after today
	gameNote, err := service.sqlDb.Queries().InsertGameNote(ctx, db.InsertGameNoteParams{
		CreatedBy:    userId,
		UpdatedBy:    userId,
		UserID:       order.ReceiverID,
		GameID:       nil, // TODO: Implement games
		Name:         req.GameNote.Name,
		Link:         req.GameNote.Link,
		ReleaseDate:  req.GameNote.ReleaseDate,
		Rate:         req.GameNote.Rate,
		Comment:      req.GameNote.Comment,
		Ordered:      true,
		Status:       req.GameNote.Status,
		LastPlayedAt: req.GameNote.LastPlayedAt,
		PosterKey:    posterKey,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game note creation", err)
	}

	// clear poster URL cache

	for sizeName := range posterSizes {
		cacheKey := fmt.Sprintf("poster:game-note:%s:%s", gameNote.ID, sizeName)
		err = service.cache.DeleteKey(ctx, cacheKey)
		if err != nil {
			logger.Errorf(ctx, "Error occurred deleting avatar URL from cache: %v", err)
		}
	}

	// Create game note - order relation

	var g errgroup.Group

	g.Go(func() error {
		return service.gameNoteOrderService.CreateGameNoteOrder(ctx, userId, initialOrder.ID, gameNote.ID)
	})

	// Index documents in Elasticsearch

	g.Go(func() error {
		return service.IndexGameNote(ctx, gameNote, initialOrderer)
	})

	g.Go(func() error {
		return service.contentService.IndexContent(ctx, gameNote.ID, gameNote.Name, gameNote.UserID, db.ContentCategoryGames)
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return gameNote, nil
}

// Validates incoming data for #CreateGameNote func
func (service *gameNoteService) ValidateCreateGameNote(req *types.CreateGameNoteReq, userId uuid.UUID) error {
	// User is required
	if len(userId) == 0 {
		return errors.NewUnauthorizedError("Authentication is required", nil)
	}

	if len(req.InitialOrderID) == 0 {
		// Game note or order ID is a minimum
		if req.GameNote == nil {
			return errors.NewBadRequestError("Game or initial order ID is required", nil)
		}

		// Name is expected
		if len(req.GameNote.Name) == 0 {
			return errors.NewBadRequestError("Name of the game is required", nil)
		}
	}

	return nil
}

func (service *gameNoteService) IndexGameNote(ctx context.Context, gameNote *db.GameNote, initialOrderer *db.Orderer) error {
	document := &types.EsGameNote{
		ID:          gameNote.ID,
		Name:        gameNote.Name,
		UserID:      gameNote.UserID,
		OrdererName: initialOrderer.Username,
		RequestDate: gameNote.CreatedAt,
		Status:      gameNote.Status,
	}
	_, err := service.elastic.IndexDocument(ctx, "game_notes", document)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during game note indexing", err)
	}
	return nil
}
