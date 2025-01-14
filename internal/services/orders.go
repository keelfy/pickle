package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
)

type Order struct {
	sqlDb                *storage.SQLDatabase
	userService          *Profile
	ordererService       *Orderer
	gameNoteOrderService *GameNoteOrder
}

func NewOrderService(sqlDb *storage.SQLDatabase, userService *Profile, ordererService *Orderer, gameNoteOrderService *GameNoteOrder) *Order {
	return &Order{
		sqlDb:                sqlDb,
		userService:          userService,
		ordererService:       ordererService,
		gameNoteOrderService: gameNoteOrderService,
	}
}

func (service *Order) GetOrderById(ctx context.Context, id uuid.UUID) (*db.Order, error) {
	orders, err := service.sqlDb.Queries.FindOrderById(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return orders, nil
}

func (service *Order) GetSortedByReceiverId(ctx context.Context, receiverId uuid.UUID, sort *types.CursorSort) ([]*db.Order, error) {
	orders, err := service.findSortedOrdersByReceiverId(ctx, receiverId, sort)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return orders, nil
}

const findOrdersByReceiverIdQuery = `
	SELECT id, created_at, payment_type, amount, status, orderer_username, message, category, updated_message, updated_category
	FROM "orders"
	WHERE "receiver_id" = $1 
		AND "%s" %s $2 
	ORDER BY "%s" %s 
	LIMIT $3
`

// Author: Egor Kuzmin (keelfy)
// Queries orders by receiver id with cursor pagination and dynamic sorting
func (service *Order) findSortedOrdersByReceiverId(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*db.Order, error) {
	comparisonOperator := "<"
	if strings.ToUpper(sort.Direction) == "DESC" {
		comparisonOperator = ">"
	}

	query := fmt.Sprintf(findOrdersByReceiverIdQuery, sort.Column, comparisonOperator, strings.ToLower(sort.Column), strings.ToUpper(sort.Direction))
	rows, err := service.sqlDb.Conn.Query(ctx, query, receiverID, sort.Cursor, sort.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*db.Order
	for rows.Next() {
		var i db.Order
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.PaymentType,
			&i.Amount,
			&i.Status,
			&i.OrdererUsername,
			&i.Message,
			&i.Category,
			&i.UpdatedMessage,
			&i.UpdatedCategory,
		); err != nil {
			return nil, err
		}
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// Validates that receivers of the order by ID equals provided and approves the order if so
// Returns CustomError as error
func (service *Order) ApproveOrderByIdAndReceiverId(ctx context.Context, orderId, receiverId, initiatorUserId uuid.UUID) (*db.Order, error) {
	// Find initial order for this game note
	initialOrder, err := service.sqlDb.Queries.FindOrderById(ctx, orderId)
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
	initialOrder, err = service.sqlDb.Queries.UpdateOrderById(ctx, db.UpdateOrderByIdParams{
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
func (service *Order) UpdateOrderStatus(ctx context.Context, order *db.Order, status db.OrderStatus, initiatorUserID uuid.UUID) (*db.Order, error) {
	// Approve the order
	approvedOrder, err := service.sqlDb.Queries.UpdateOrderById(ctx, db.UpdateOrderByIdParams{
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

func (service *Order) CreateOrder(ctx context.Context, userId uuid.UUID, req *types.CreateOrderReq) (*db.Order, error) {
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

	createdOrder, err := service.sqlDb.Queries.InsertOrder(ctx, db.InsertOrderParams{
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

func (service *Order) UpdateOrderById(ctx context.Context, orderId uuid.UUID, req *types.UpdateOrderReq, userId uuid.UUID) (*db.Order, error) {
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

	updatedOrder, err := service.sqlDb.Queries.UpdateOrderById(ctx, db.UpdateOrderByIdParams{
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

func (service *Order) ApproveOrderById(ctx context.Context, orderId, gameNoteId, userId uuid.UUID) (*db.Order, error) {
	order, err := service.GetOrderById(ctx, orderId)
	if err != nil {
		return nil, err
	}

	if order.ReceiverID != userId {
		return nil, errors.NewForbiddenError("User is not allowed to approve the order", nil)
	}

	// TODO: validate the req body

	// Approve the order
	approvedOrder, err := service.sqlDb.Queries.UpdateOrderById(ctx, db.UpdateOrderByIdParams{
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

func (service *Order) GetPaginatedByGameNoteId(ctx context.Context, id uuid.UUID, pagination *types.Pagination) ([]*db.Order, error) {
	orders, err := service.sqlDb.Queries.FindPaginatedOrdersByGameNoteId(ctx, db.FindPaginatedOrdersByGameNoteIdParams{
		GameNoteID: id,
		Limit:      int32(pagination.Size),
		Offset:     int32(pagination.From),
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return orders, nil
}

func (service *Order) CountGameNotesById(ctx context.Context, id uuid.UUID) (int64, error) {
	count, err := service.sqlDb.Queries.CountOrdersByGameNoteId(ctx, id)
	if err != nil {
		return 0, errors.NewInternalServerError("Error occurred during orders count", err)
	}
	return count, nil
}
