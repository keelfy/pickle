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
	UpdateOrderStatus(ctx context.Context, order *db.Order, status db.OrderStatus, initiatorUserID uuid.UUID) (*db.Order, error)
	CreateOrder(ctx context.Context, userId uuid.UUID, req *types.CreateOrderReq) (*db.Order, error)
	UpdateOrderByID(ctx context.Context, orderId uuid.UUID, initiator, receiver *db.Profile, req *types.OrderReq) (*db.Order, error)
	GetPaginatedByGameNoteId(ctx context.Context, id uuid.UUID, pagination *types.Pagination) ([]*db.Order, error)
	CountGameNotesById(ctx context.Context, id uuid.UUID) (int64, error)
	CountOrdersByReceiverId(ctx context.Context, receiverId uuid.UUID) (int64, error)
}

type orderService struct {
	sqlDb          storage.RelationalStorage
	userService    ProfileService
	ordererService OrdererService
	contentService ContentService
}

func NewOrderService(sqlDb storage.RelationalStorage, userService ProfileService, ordererService OrdererService, contentService ContentService) OrderService {
	return &orderService{
		sqlDb:          sqlDb,
		userService:    userService,
		ordererService: ordererService,
		contentService: contentService,
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

func (service *orderService) UpdateOrderByID(ctx context.Context, orderId uuid.UUID, initiator, receiver *db.Profile, req *types.OrderReq) (*db.Order, error) {
	order, err := service.GetOrderById(ctx, orderId)
	if err != nil {
		return nil, err
	}

	if order.ReceiverID != receiver.UserID {
		return nil, errors.NewForbiddenError("User is not allowed to update the order", nil)
	}

	if order.Status != req.Status {
		if req.Status == db.OrderStatusApproved {
			return service.approveOrderByID(ctx, order, initiator, req)
		} else if req.Status == db.OrderStatusRejected {
			return service.rejectOrderByID(ctx, order, initiator)
		}
	}

	return order, nil
}

func (service *orderService) approveOrderByID(ctx context.Context, order *db.Order, approver *db.Profile, req *types.OrderReq) (*db.Order, error) {
	if req.Category == nil || len(*req.Category) == 0 {
		if req.ContentID == nil || len(*req.ContentID) == 0 {
			return nil, errors.NewBadRequestError("Either category and title or content ID is required", nil)
		}
	} else if req.Title == nil || len(*req.Title) == 0 {
		return nil, errors.NewBadRequestError("Both category and title are required", nil)
	}

	tx, err := service.sqlDb.Begin(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}
	defer tx.Rollback(ctx)
	qtx := service.sqlDb.Queries().WithTx(tx)

	approvedOrder, err := qtx.UpdateOrderById(ctx, db.UpdateOrderByIdParams{
		ID:        order.ID,
		UpdatedBy: approver.UserID,
		Status:    db.OrderStatusApproved,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	if req.ContentID != nil && len(*req.ContentID) != 0 {
		err = service.contentService.AttachOrderToContent(ctx, order, *req.ContentID, *req.Category)
		if err != nil {
			return nil, err
		}
	} else {
		orderer, err := service.ordererService.GetOrdererById(ctx, order.OrdererID)
		if err != nil {
			return nil, err
		}

		err = service.contentService.CreateOrderedContent(ctx, *req.Category, order, orderer, *req.Title)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	return approvedOrder, nil
}

func (service *orderService) rejectOrderByID(ctx context.Context, order *db.Order, initiator *db.Profile) (*db.Order, error) {
	updatedOrder, err := service.sqlDb.Queries().UpdateOrderById(ctx, db.UpdateOrderByIdParams{
		ID:        order.ID,
		UpdatedBy: initiator.UserID,
		Status:    db.OrderStatusRejected,
	})
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found to update", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order update", err)
	}

	return updatedOrder, nil
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
