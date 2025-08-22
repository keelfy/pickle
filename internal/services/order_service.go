package services

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
)

type OrderService interface {
	GetOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error)
	GetOrderByIDWithOrderer(ctx context.Context, id uuid.UUID) (*domain.Order, error)
	GetSortedByReceiverID(ctx context.Context, receiverID uuid.UUID, sort *domain.CursorSort, filters domain.Filters) ([]*domain.Order, error)
	CreateOrder(ctx context.Context, tx sql.Queries, ordererID uuid.UUID, cmd *commands.CreateOrderCommand) (*domain.Order, error)
	GetOrdersByContentNoteID(ctx context.Context, cmd *commands.GetOrdersByContentNoteIDCommand) ([]*domain.Order, error)
	CountOrdersByReceiverID(ctx context.Context, receiverID uuid.UUID) (int64, error)
	// Decisions
	GetOrderDecisionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]*domain.OrderDecision, error)
	IsOrderDecisionExistsByOrderID(ctx context.Context, orderID uuid.UUID) (bool, error)
	ApproveOrderByID(ctx context.Context, tx sql.Queries, order *domain.Order, approver domain.IUser, relatedNote domain.IContentNote) (*domain.OrderDecision, error)
	RejectOrderByID(ctx context.Context, tx sql.Queries, order *domain.Order, initiator domain.IUser) (*domain.OrderDecision, error)
}

type orderService struct {
	sqlDb             storage.RelationalStorage
	userService       UserService
	ordererService    OrdererService
	contentService    ContentNoteService
	permissionService PermissionService
	ordersBroker      OrdersBrokerService
}

func NewOrderService(
	sqlDb storage.RelationalStorage,
	userService UserService,
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

func (s *orderService) GetOrderDecisionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]*domain.OrderDecision, error) {
	decisions, err := s.sqlDb.Queries().FindOrderDecisionsByOrderID(ctx, orderID)
	if err == pgx.ErrNoRows {
		return nil, utils.NewBadRequestError("order not found", err)
	}
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get order decisions by order ID", err)
	}
	return decisions, nil
}

func (s *orderService) IsOrderDecisionExistsByOrderID(ctx context.Context, orderID uuid.UUID) (bool, error) {
	exists, err := s.sqlDb.Queries().OrderDecisionExistsByOrderID(ctx, orderID)
	if err != nil {
		return false, utils.NewInternalServerError("failed to check if order decision exists by order ID", err)
	}
	return exists, nil
}

func (s *orderService) GetOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	order, err := s.sqlDb.Queries().FindOrderByID(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, utils.NewBadRequestError("order not found", err)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to get order by ID", err)
	}
	return order, nil
}

func (s *orderService) GetOrderByIDWithOrderer(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	order, err := s.sqlDb.Queries().FindOrderByIDWithOrderer(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, utils.NewBadRequestError("order not found", err)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to get order by ID with orderer", err)
	}
	return order, nil
}

func (s *orderService) GetSortedByReceiverID(ctx context.Context, receiverID uuid.UUID, sort *domain.CursorSort, filters domain.Filters) ([]*domain.Order, error) {
	locale := utils.GetLocaleFromCtx(ctx)
	orders, err := s.sqlDb.Queries().FindSortedOrdersByReceiverID(ctx, sql.FindSortedOrdersByReceiverIDParams{
		ReceiverID: receiverID,
		Sort:       sort,
		Filters:    filters,
		Locale:     locale,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get sorted orders by receiver ID", err)
	}
	return orders, nil
}

func (s *orderService) CreateOrder(ctx context.Context, tx sql.Queries, ordererID uuid.UUID, cmd *commands.CreateOrderCommand) (*domain.Order, error) {
	authUserID := utils.GetUserIDFromContextOrNil(ctx)

	var reference json.RawMessage
	if cmd.Reference != nil {
		reference = json.RawMessage(*cmd.Reference)
	} else {
		reference = json.RawMessage("{}")
	}

	createdOrder, err := tx.InsertOrder(ctx, sql.InsertOrderParams{
		ReceiverID: cmd.ReceiverID,
		OrdererID:  ordererID,
		Category:   cmd.Category,
		ContentID:  cmd.ContentID,
		Message:    cmd.Message,
		Source:     cmd.Source,
		Reference:  reference,
		Anonymous:  cmd.IsAnonymously,
		CreatedBy:  authUserID,
		UpdatedBy:  authUserID,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to create order", err)
	}

	return createdOrder, nil
}

func (s *orderService) ApproveOrderByID(ctx context.Context, tx sql.Queries, order *domain.Order, approver domain.IUser, relatedNote domain.IContentNote) (*domain.OrderDecision, error) {
	relatedNoteID := relatedNote.GetID()
	relatedNoteCategory := relatedNote.GetCategory()

	orderDecision, err := tx.InsertOrderDecision(ctx, sql.InsertOrderDecisionParams{
		OrderID:             order.ID,
		DecidedBy:           approver.GetID(),
		Status:              domain.OrderDecisionStatusApproved,
		ContentNoteID:       &relatedNoteID,
		ContentNoteCategory: &relatedNoteCategory,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to insert order decision", err)
	}

	return orderDecision, nil
}

func (s *orderService) RejectOrderByID(ctx context.Context, tx sql.Queries, order *domain.Order, initiator domain.IUser) (*domain.OrderDecision, error) {
	orderDecision, err := tx.InsertOrderDecision(ctx, sql.InsertOrderDecisionParams{
		OrderID:   order.ID,
		DecidedBy: initiator.GetID(),
		Status:    domain.OrderDecisionStatusRejected,
	})
	if err == pgx.ErrNoRows {
		return nil, utils.NewBadRequestError("order not found to reject", err)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to reject order", err)
	}

	return orderDecision, nil
}

func (s *orderService) GetOrdersByContentNoteID(ctx context.Context, cmd *commands.GetOrdersByContentNoteIDCommand) ([]*domain.Order, error) {
	orders, err := s.sqlDb.Queries().FindPaginatedOrdersByContentNoteID(ctx, cmd.ID, cmd.Category, cmd.Pagination)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to fetch orders", err)
	}
	return orders, nil
}

func (s *orderService) CountOrdersByReceiverID(ctx context.Context, receiverID uuid.UUID) (int64, error) {
	count, err := s.sqlDb.Queries().CountOrdersByReceiverID(ctx, receiverID)
	if err != nil {
		return 0, utils.NewInternalServerError("failed to count orders by receiver ID", err)
	}
	return count, nil
}
