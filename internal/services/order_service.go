package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
)

type OrderService interface {
	GetOrderById(ctx context.Context, id uuid.UUID) (*db.Order, error)
	GetSortedByReceiverId(ctx context.Context, receiverId uuid.UUID, sort *types.CursorSort) ([]*db.Order, error)
	ApproveOrderByIdAndReceiverId(ctx context.Context, orderId, receiverId, initiatorUserId uuid.UUID) (*db.Order, error)
	UpdateOrderStatus(ctx context.Context, order *db.Order, status db.OrderStatus, initiatorUserID uuid.UUID) (*db.Order, error)
	CreateOrder(ctx context.Context, userId uuid.UUID, req *types.CreateOrderReq) (*db.Order, error)
	UpdateOrderById(ctx context.Context, orderId uuid.UUID, req *types.UpdateOrderReq, userId uuid.UUID) (*db.Order, error)
	ApproveOrderById(ctx context.Context, orderId, gameNoteId, userId uuid.UUID) (*db.Order, error)
	GetPaginatedByGameNoteId(ctx context.Context, id uuid.UUID, pagination *types.Pagination) ([]*db.Order, error)
	CountGameNotesById(ctx context.Context, id uuid.UUID) (int64, error)
	CountOrdersByReceiverId(ctx context.Context, receiverId uuid.UUID) (int64, error)
}

type orderService struct {
	sqlDb                storage.SQLDatabase
	userService          ProfileService
	ordererService       OrdererService
	gameNoteOrderService GameNoteOrderService
}

func NewOrderService(sqlDb storage.SQLDatabase, userService ProfileService, ordererService OrdererService, gameNoteOrderService GameNoteOrderService) OrderService {
	return &orderService{
		sqlDb:                sqlDb,
		userService:          userService,
		ordererService:       ordererService,
		gameNoteOrderService: gameNoteOrderService,
	}
}

func (service *orderService) GetOrderById(ctx context.Context, id uuid.UUID) (*db.Order, error) {
	orders, err := service.sqlDb.Queries().FindOrderById(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return orders, nil
}

func (service *orderService) GetSortedByReceiverId(ctx context.Context, receiverId uuid.UUID, sort *types.CursorSort) ([]*db.Order, error) {
	orders, err := service.sqlDb.FindSortedOrdersByReceiverId(ctx, receiverId, sort)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return orders, nil
}

// Validates that receivers of the order by ID equals provided and approves the order if so
// Returns CustomError as error
func (service *orderService) ApproveOrderByIdAndReceiverId(ctx context.Context, orderId, receiverId, initiatorUserId uuid.UUID) (*db.Order, error) {
	// Find initial order for this game note
	initialOrder, err := service.sqlDb.Queries().FindOrderById(ctx, orderId)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during initial order search", err)
	}

	// Order must be found
	if initialOrder == nil {
		return nil, errors.NewBadRequestError("Initial order not found", nil)
	}

	// Validate that order sent to the same user as we are creating game note for
	if initialOrder.ReceiverID != receiverId {
		return nil, errors.NewForbiddenError("Receiver of the order do not match", nil)
	}

	// Approve the order
	initialOrder, err = service.sqlDb.Queries().UpdateOrderById(ctx, db.UpdateOrderByIdParams{
		ID:        initialOrder.ID,
		UpdatedBy: initiatorUserId,
		Status:    db.OrderStatusApproved,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	return initialOrder, nil
}

// Validates that receivers of the order by ID equals provided and approves the order if so
// Returns CustomError as error
func (service *orderService) UpdateOrderStatus(ctx context.Context, order *db.Order, status db.OrderStatus, initiatorUserID uuid.UUID) (*db.Order, error) {
	// Approve the order
	approvedOrder, err := service.sqlDb.Queries().UpdateOrderById(ctx, db.UpdateOrderByIdParams{
		ID:        order.ID,
		Status:    status,
		UpdatedBy: initiatorUserID,
	})

	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found to approve", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	return approvedOrder, nil
}

func (service *orderService) CreateOrder(ctx context.Context, userId uuid.UUID, req *types.CreateOrderReq) (*db.Order, error) {
	creator, err := service.userService.GetProfileById(ctx, userId)
	if err != nil {
		return nil, err
	}

	receiver, err := service.userService.GetProfileByLink(ctx, req.ReceiverLink)
	if err != nil {
		return nil, err
	}

	orderer, err := service.ordererService.CreateOrderer(ctx, req.OrdererUsername, creator)
	if err != nil {
		return nil, err
	}

	createdOrder, err := service.sqlDb.Queries().InsertOrder(ctx, db.InsertOrderParams{
		CreatedBy:       creator.UserID,
		UpdatedBy:       creator.UserID,
		ReceiverID:      receiver.UserID,
		PaymentType:     req.PaymentType,
		Amount:          req.Amount,
		OrdererID:       orderer.ID,
		OrdererUsername: orderer.Username,
		Category:        req.Category,
		Message:         req.Message,
		Status:          db.OrderStatusPending,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order creation", err)
	}

	return createdOrder, nil
}

func (service *orderService) UpdateOrderById(ctx context.Context, orderId uuid.UUID, req *types.UpdateOrderReq, userId uuid.UUID) (*db.Order, error) {
	order, err := service.GetOrderById(ctx, orderId)
	if err != nil {
		return nil, err
	}

	if order.ReceiverID != userId {
		return nil, errors.NewForbiddenError("User is not allowed to update the order", nil)
	}

	if req.Status != db.OrderStatusRejected {
		return nil, errors.NewBadRequestError("Only status 'rejected' is allowed to be set", nil)
	}

	updatedOrder, err := service.sqlDb.Queries().UpdateOrderById(ctx, db.UpdateOrderByIdParams{
		ID:        order.ID,
		UpdatedBy: userId,
		Status:    req.Status,
	})
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found to update", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order update", err)
	}

	return updatedOrder, nil
}

func (service *orderService) ApproveOrderById(ctx context.Context, orderId, gameNoteId, userId uuid.UUID) (*db.Order, error) {
	order, err := service.GetOrderById(ctx, orderId)
	if err != nil {
		return nil, err
	}

	if order.ReceiverID != userId {
		return nil, errors.NewForbiddenError("User is not allowed to approve the order", nil)
	}

	// TODO: validate the req body

	// Approve the order
	approvedOrder, err := service.sqlDb.Queries().UpdateOrderById(ctx, db.UpdateOrderByIdParams{
		ID:        order.ID,
		UpdatedBy: userId,
		Status:    db.OrderStatusApproved,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	// Connect initial approved order and game note together
	err = service.gameNoteOrderService.CreateGameNoteOrder(ctx, userId, order.ID, gameNoteId)
	if err != nil {
		return nil, err
	}

	return approvedOrder, nil
}

func (service *orderService) GetPaginatedByGameNoteId(ctx context.Context, id uuid.UUID, pagination *types.Pagination) ([]*db.Order, error) {
	orders, err := service.sqlDb.Queries().FindPaginatedOrdersByGameNoteId(ctx, db.FindPaginatedOrdersByGameNoteIdParams{
		GameNoteID: id,
		Limit:      int32(pagination.Size),
		Offset:     int32(pagination.From),
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return orders, nil
}

func (service *orderService) CountGameNotesById(ctx context.Context, id uuid.UUID) (int64, error) {
	count, err := service.sqlDb.Queries().CountOrdersByGameNoteId(ctx, id)
	if err != nil {
		return 0, errors.NewInternalServerError("Error occurred during orders count", err)
	}
	return count, nil
}

func (service *orderService) CountOrdersByReceiverId(ctx context.Context, receiverId uuid.UUID) (int64, error) {
	count, err := service.sqlDb.Queries().CountOrdersByReceiverId(ctx, receiverId)
	if err != nil {
		return 0, errors.NewInternalServerError("Error occurred during orders count", err)
	}
	return count, nil
}
