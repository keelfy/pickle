package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
)

type GameNoteOrderService interface {
	CreateGameNoteOrder(ctx context.Context, userId, orderId, gameNoteId uuid.UUID) error
}

type gameNoteOrderService struct {
	sqlDb storage.RelationalStorage
}

func NewGameNoteOrderService(sqlDb storage.RelationalStorage) GameNoteOrderService {
	return &gameNoteOrderService{
		sqlDb: sqlDb,
	}
}

// Creates GameNote - Order relation
func (service *gameNoteOrderService) CreateGameNoteOrder(ctx context.Context, userId, orderId, gameNoteId uuid.UUID) error {
	// Connect initial approved order and game note together
	_, err := service.sqlDb.Queries().InsertGameNoteOrder(ctx, db.InsertGameNoteOrderParams{
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
