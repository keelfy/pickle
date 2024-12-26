package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type GameNote struct {
	queries      *db.Queries
	orderService *Order
	userService  *User
}

func NewGameNoteService(queries *db.Queries, orderService *Order, userService *User) *GameNote {
	return &GameNote{
		queries:      queries,
		orderService: orderService,
		userService:  userService,
	}
}

// Fetches game notes by receiver ID or returns CustomError if error occurred
func (service *GameNote) GetByReceiverId(ctx context.Context, receiverId uuid.UUID, sort *utils.CursorSort) ([]*db.GameNote, error) {
	gameNotes, err := service.queries.FindPaginatedGameNotesByUserId(ctx, db.FindPaginatedGameNotesByUserIdParams{
		UserID: receiverId,
		// UpdatedAt: lastUpdatedAt,
		// Limit: int32(limit),
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game notes fetching", err)
	}

	return gameNotes, nil
}

// Creates game note and initial order (or approves existing) using user
// Validated inputs is expected
func (service *GameNote) CreateGameNote(ctx context.Context, req *types.CreateGameNoteReq, userId uuid.UUID) (*db.GameNote, error) {
	initialOrder, err := service.orderService.GetOrderById(ctx, req.InitialOrderId)
	order, err := service.orderService.ApproveOrder(ctx, initialOrder, userId)

	if err != nil {
		return nil, err
	}

	// Insert new game note into database
	// TODO: Data validation before insertion, e.g. min-max rating or release date not after today
	gameNote, err := service.queries.InsertGameNote(ctx, db.InsertGameNoteParams{
		CreatedBy:        userId,
		UpdatedBy:        userId,
		UserID:           order.ReceiverID,
		GameID:           nil, // TODO: Implement games
		Name:             req.GameNote.Name,
		Link:             req.GameNote.Link,
		ReleaseDate:      req.GameNote.ReleaseDate,
		Rate:             req.GameNote.Rate,
		Comment:          req.GameNote.Comment,
		Ordered:          true,
		Status:           req.GameNote.Status,
		CompletionStatus: req.GameNote.CompletionStatus,
		CompletionDate:   req.GameNote.CompletionDate,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game note creation", err)
	}

	err = service.createGameNoteOrder(ctx, userId, initialOrder.ID, gameNote.ID)
	if err != nil {
		return nil, err
	}

	return gameNote, nil
}

// Validates incoming data for #CreateGameNote func
func (service *GameNote) ValidateCreateGameNote(req *types.CreateGameNoteReq, userId uuid.UUID) error {
	// User is required
	if len(userId) == 0 {
		return errors.NewUnauthorizedError("Authentication is required", nil)
	}

	if len(req.InitialOrderId) == 0 {
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

// Creates GameNote - Order relation
func (service *GameNote) createGameNoteOrder(ctx context.Context, userId, orderId, gameNoteId uuid.UUID) error {
	// Connect initial approved order and game note together
	_, err := service.queries.InsertGameNoteOrder(ctx, db.InsertGameNoteOrderParams{
		OrderID:    orderId,
		GameNoteID: gameNoteId,
		CreatedBy:  userId,
		UpdatedBy:  userId,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred during game note order creation", err)
	}

	return nil
}
