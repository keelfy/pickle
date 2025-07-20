package services

import (
	"context"
	"encoding/json"
	"slices"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/mapper"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type OrderService interface {
	GetOrderByID(ctx context.Context, id uuid.UUID) (*models.Order, error)
	GetSortedByReceiverID(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*models.Order, error)
	UpdateOrderStatus(ctx context.Context, order *models.Order, status db.OrderStatus, initiatorUserID uuid.UUID) (*models.Order, error)
	CreateOrder(ctx context.Context, receiverID uuid.UUID, req *types.CreateOrderReq) (*models.Order, error)
	UpdateOrderByID(ctx context.Context, orderID, userID uuid.UUID, req *types.OrderReq) (*models.Order, uuid.UUID, error)
	GetPaginatedByContentNoteID(ctx context.Context, category db.ContentCategory, id uuid.UUID, pagination *types.Pagination) ([]*models.Order, error)
	CountOrdersByReceiverID(ctx context.Context, receiverID uuid.UUID) (int64, error)
}

type orderService struct {
	sqlDb             storage.RelationalStorage
	userService       ProfileService
	ordererService    OrdererService
	contentService    ContentNoteService
	permissionService PermissionService
	ordersBroker      OrdersBrokerService
}

func NewOrderService(
	sqlDb storage.RelationalStorage,
	userService ProfileService,
	ordererService OrdererService,
	contentService ContentNoteService,
	permissionService PermissionService,
	ordersBroker OrdersBrokerService,
) OrderService {
	return &orderService{
		sqlDb:             sqlDb,
		userService:       userService,
		ordererService:    ordererService,
		contentService:    contentService,
		permissionService: permissionService,
		ordersBroker:      ordersBroker,
	}
}

func (service *orderService) GetOrderByID(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	orders, err := service.sqlDb.Queries().FindOrderByID(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}
	return &models.Order{
		ID:                 orders.ID,
		CreatedAt:          orders.CreatedAt,
		CreatedBy:          orders.CreatedBy,
		UpdatedAt:          orders.UpdatedAt,
		UpdatedBy:          orders.UpdatedBy,
		ReceiverID:         orders.ReceiverID,
		PaymentType:        orders.PaymentType,
		Amount:             orders.Amount,
		Status:             orders.Status,
		OrdererID:          orders.OrdererID,
		Message:            orders.Message,
		Category:           orders.Category,
		Anonymous:          orders.Anonymous,
		Source:             orders.Source,
		Reference:          orders.Reference,
		OrdererDisplayName: orders.OrdererDisplayName,
	}, nil
}

func (service *orderService) GetSortedByReceiverID(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*models.Order, error) {
	orders, err := service.sqlDb.FindSortedOrdersByReceiverId(ctx, receiverID, sort)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
	}

	orderModels := make([]*models.Order, len(orders))
	for i, order := range orders {
		orderModels[i] = &models.Order{
			ID:                 order.ID,
			CreatedAt:          order.CreatedAt,
			CreatedBy:          order.CreatedBy,
			UpdatedAt:          order.UpdatedAt,
			UpdatedBy:          order.UpdatedBy,
			ReceiverID:         order.ReceiverID,
			PaymentType:        order.PaymentType,
			Amount:             order.Amount,
			Status:             order.Status,
			OrdererID:          order.OrdererID,
			Message:            order.Message,
			Category:           order.Category,
			Anonymous:          order.Anonymous,
			Source:             order.Source,
			Reference:          order.Reference,
			OrdererDisplayName: order.OrdererDisplayName,
		}
	}
	return orderModels, nil
}

// Validates that receivers of the order by ID equals provided and approves the order if so
// Returns CustomError as error
func (service *orderService) UpdateOrderStatus(ctx context.Context, order *models.Order, status db.OrderStatus, initiatorUserID uuid.UUID) (*models.Order, error) {
	// Approve the order
	approvedOrder, err := service.sqlDb.Queries().UpdateOrderByID(ctx, db.UpdateOrderByIDParams{
		ID:        order.ID,
		Status:    status,
		UpdatedBy: initiatorUserID,
	})

	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found to approve", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	return mapper.MapDBOrderToModel(approvedOrder, nil), nil
}

func (service *orderService) CreateOrder(ctx context.Context, receiverID uuid.UUID, req *types.CreateOrderReq) (*models.Order, error) {
	authUserId := utils.GetUserIDFromContextOrNil(ctx)

	var (
		creator *db.Profile
		err     error
	)

	if authUserId != nil {
		creator, err = service.userService.GetProfileByID(ctx, *authUserId)
		if err != nil {
			return nil, err
		}
	}

	receiver, err := service.userService.GetProfileByID(ctx, receiverID)
	if err != nil {
		return nil, err
	}

	// TODO: handle it properly
	if req.Source != "twitch-channel-points" {
		if receiver.SuggestionPreferences == nil {
			return nil, errors.NewBadRequestError("Receiver does not have suggestion preferences enabled", nil)
		}

		preferences := &models.SuggestionPreferences{}
		err = json.Unmarshal(receiver.SuggestionPreferences, preferences)
		if err != nil {
			return nil, errors.NewInternalServerError("Error occurred during unmarshalling suggestion preferences", err)
		}

		if !preferences.Enabled {
			return nil, errors.NewBadRequestError("Receiver does not have suggestion preferences enabled", nil)
		} else if !preferences.AllowedAnonymously && (req.IsAnonymously || req.OrdererUsername == "") {
			return nil, errors.NewBadRequestError("You are not allowed to create an anonymous order for this profile", nil)
		} else if !slices.Contains(preferences.Categories, req.Category) {
			return nil, errors.NewBadRequestError("You are not allowed to create an order for this category", nil)
		}
	}

	tx, err := service.sqlDb.Begin(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order creation", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		} else {
			tx.Commit(ctx)
		}
	}()
	qtx := service.sqlDb.Queries().WithTx(tx)

	orderer, err := service.ordererService.CreateReferencedOrdererIfNotExists(ctx, qtx, creator, req.OrdererUsername, req.Source, *req.ReferenceUserID)
	if err != nil {
		return nil, err
	}

	var reference []byte
	if req.Reference != nil {
		reference = []byte(*req.Reference)
	}

	createdOrder, err := qtx.InsertOrder(ctx, db.InsertOrderParams{
		ReceiverID: receiver.UserID,
		OrdererID:  orderer.ID,
		Category:   req.Category,
		Message:    req.Message,
		Status:     db.OrderStatusPending,
		Source:     req.Source,
		Reference:  reference,
		Anonymous:  req.IsAnonymously,
		CreatedBy:  authUserId,
		UpdatedBy:  authUserId,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order creation", err)
	}

	orderModel := mapper.MapDBOrderToModel(createdOrder, &orderer.DisplayName)
	service.ordersBroker.PublishOrder(orderModel)
	return orderModel, nil
}

func (service *orderService) UpdateOrderByID(ctx context.Context, orderID, userID uuid.UUID, req *types.OrderReq) (*models.Order, uuid.UUID, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, uuid.Nil, errors.NewInternalServerError("failed to get user ID from context", err)
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, userID, authUserID, types.ModeratorPermission)
	if err != nil {
		return nil, uuid.Nil, errors.NewInternalServerError("failed to check permission", err)
	}

	if !hasPermission {
		return nil, uuid.Nil, errors.NewForbiddenError("User is not allowed to update the order", nil)
	}

	initiator, err := service.userService.GetProfileByID(ctx, authUserID)
	if err != nil {
		return nil, uuid.Nil, err
	}

	order, err := service.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, uuid.Nil, err
	}

	relatedNoteID := uuid.Nil

	if order.Status != req.Status {
		if req.Status == db.OrderStatusApproved {
			order, relatedNoteID, err = service.approveOrderByID(ctx, order, initiator, req)
			if err != nil {
				return nil, uuid.Nil, err
			}
		} else if req.Status == db.OrderStatusRejected {
			order, err = service.rejectOrderByID(ctx, order, initiator)
			if err != nil {
				return nil, uuid.Nil, err
			}
		}
	}

	service.ordersBroker.PublishOrder(order)
	return order, relatedNoteID, nil
}

func (service *orderService) approveOrderByID(ctx context.Context, order *models.Order, approver *db.Profile, req *types.OrderReq) (*models.Order, uuid.UUID, error) {
	relatedNoteID := uuid.Nil

	tx, err := service.sqlDb.Begin(ctx)
	if err != nil {
		return nil, relatedNoteID, errors.NewInternalServerError("Error occurred during order approval", err)
	}
	defer tx.Rollback(ctx)
	qtx := service.sqlDb.Queries().WithTx(tx)

	approvedOrder, err := qtx.UpdateOrderByID(ctx, db.UpdateOrderByIDParams{
		ID:        order.ID,
		UpdatedBy: approver.UserID,
		Status:    db.OrderStatusApproved,
	})
	if err != nil {
		return nil, relatedNoteID, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	orderer, err := service.ordererService.GetOrdererById(ctx, order.OrdererID)
	if err != nil {
		return nil, relatedNoteID, err
	}

	err = service.contentService.AttachOrderToNoteByContentIDWithTx(ctx, qtx, order, orderer, req.ContentID, req.Category, approver.UserID)
	if err != nil {
		return nil, relatedNoteID, err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, relatedNoteID, errors.NewInternalServerError("Error occurred during order approval", err)
	}

	return mapper.MapDBOrderToModel(approvedOrder, order.OrdererDisplayName), relatedNoteID, nil
}

func (service *orderService) rejectOrderByID(ctx context.Context, order *models.Order, initiator *db.Profile) (*models.Order, error) {
	updatedOrder, err := service.sqlDb.Queries().UpdateOrderByID(ctx, db.UpdateOrderByIDParams{
		ID:        order.ID,
		UpdatedBy: initiator.UserID,
		Status:    db.OrderStatusRejected,
	})
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Order not found to update", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during order update", err)
	}

	return mapper.MapDBOrderToModel(updatedOrder, order.OrdererDisplayName), nil
}

func (service *orderService) GetPaginatedByContentNoteID(ctx context.Context, category db.ContentCategory, id uuid.UUID, pagination *types.Pagination) ([]*models.Order, error) {
	var orderModels []*models.Order

	switch category {
	case db.ContentCategoryGames:
		orders, err := service.sqlDb.Queries().FindPaginatedOrdersByGameNoteID(ctx, db.FindPaginatedOrdersByGameNoteIDParams{
			GameNoteID: id,
			Limit:      int64(pagination.Size),
			Offset:     int64(pagination.From),
		})
		if err != nil {
			return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
		}

		orderModels = make([]*models.Order, len(orders))
		for i, order := range orders {
			orderModels[i] = &models.Order{
				ID:                 order.ID,
				CreatedAt:          order.CreatedAt,
				CreatedBy:          order.CreatedBy,
				UpdatedAt:          order.UpdatedAt,
				UpdatedBy:          order.UpdatedBy,
				ReceiverID:         order.ReceiverID,
				PaymentType:        order.PaymentType,
				Amount:             order.Amount,
				Status:             order.Status,
				OrdererID:          order.OrdererID,
				Message:            order.Message,
				Category:           order.Category,
				Anonymous:          order.Anonymous,
				Source:             order.Source,
				Reference:          order.Reference,
				OrdererDisplayName: order.OrdererDisplayName,
			}
		}
	case db.ContentCategoryMovies:
		orders, err := service.sqlDb.Queries().FindPaginatedOrdersByMovieNoteID(ctx, db.FindPaginatedOrdersByMovieNoteIDParams{
			MovieNoteID: id,
			Limit:       int64(pagination.Size),
			Offset:      int64(pagination.From),
		})
		if err != nil {
			return nil, errors.NewInternalServerError("Error occurred during orders fetching", err)
		}

		orderModels = make([]*models.Order, len(orders))
		for i, order := range orders {
			orderModels[i] = &models.Order{
				ID:                 order.ID,
				CreatedAt:          order.CreatedAt,
				CreatedBy:          order.CreatedBy,
				UpdatedAt:          order.UpdatedAt,
				UpdatedBy:          order.UpdatedBy,
				ReceiverID:         order.ReceiverID,
				PaymentType:        order.PaymentType,
				Amount:             order.Amount,
				Status:             order.Status,
				OrdererID:          order.OrdererID,
				Message:            order.Message,
				Category:           order.Category,
				Anonymous:          order.Anonymous,
				Source:             order.Source,
				Reference:          order.Reference,
				OrdererDisplayName: order.OrdererDisplayName,
			}
		}
	default:
		return nil, errors.NewBadRequestError("Invalid content category", nil)
	}

	return orderModels, nil
}

func (service *orderService) CountOrdersByReceiverID(ctx context.Context, receiverID uuid.UUID) (int64, error) {
	count, err := service.sqlDb.Queries().CountOrdersByReceiverID(ctx, receiverID)
	if err != nil {
		return 0, errors.NewInternalServerError("Error occurred during orders count", err)
	}
	return count, nil
}
