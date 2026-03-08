package handlers

import (
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/transport/http/requests"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/usecases"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

// Referenced by swag in @Param body annotations.
var _ = requests.CreateOrder{}

type OrderHandler interface {
	GetOrderByID(w http.ResponseWriter, r *http.Request)
	GetSortedOrdersByUserID(w http.ResponseWriter, r *http.Request)
	CreatePickleSuggestionOrder(w http.ResponseWriter, r *http.Request)
	CreateOrderWebhook(w http.ResponseWriter, r *http.Request)
	ApproveOrderByID(w http.ResponseWriter, r *http.Request)
	RejectOrderByID(w http.ResponseWriter, r *http.Request)
}

type orderHandler struct {
	sqlDb              storage.RelationalStorage
	userService        services.UserService
	orderService       services.OrderService
	ordererService     services.OrdererService
	avatarService      services.AvatarService
	contentService     services.ContentService
	contentNoteService services.ContentNoteService
	permissionService  services.PermissionService
	ordersBroker       services.OrdersBrokerService
	// usecases
	createOrderUseCase usecases.CreateOrderUseCase
	logger             *zap.SugaredLogger
}

func NewOrdersHandler(
	sqlDb storage.RelationalStorage,
	userService services.UserService,
	orderService services.OrderService,
	ordererService services.OrdererService,
	avatarService services.AvatarService,
	contentService services.ContentService,
	contentNoteService services.ContentNoteService,
	permissionService services.PermissionService,
	ordersBroker services.OrdersBrokerService,
	createOrderUseCase usecases.CreateOrderUseCase, zapLogger *zap.SugaredLogger,
) OrderHandler {
	return &orderHandler{
		sqlDb:              sqlDb,
		userService:        userService,
		orderService:       orderService,
		ordererService:     ordererService,
		avatarService:      avatarService,
		contentService:     contentService,
		contentNoteService: contentNoteService,
		permissionService:  permissionService,
		ordersBroker:       ordersBroker,
		createOrderUseCase: createOrderUseCase, logger: zapLogger,
	}
}

// @Summary Get order by ID
// @Description Get order by ID
// @Tags orders
// @Accept json
// @Produce json
// @Param orderId path string true "Order ID"
// @Param userId path string true "User ID"
// @Success 200 {object} resp.DetailedOrder
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders/{orderId} [get]
func (h *orderHandler) GetOrderByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetOrderByIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	order, err := h.orderService.GetOrderByID(ctx, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var ordererAvatarURL string

	orderer, err := h.ordererService.GetOrdererWithUserByID(ctx, order.OrdererID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if orderer.UserID != nil {
		url, err := h.avatarService.GetAvatarURLByUserID(ctx, *orderer.UserID, domain.AvatarSizeMedium)
		if err != nil {
			logger.WithRequestID(ctx, h.logger).Errorf("failed to get avatar URL by user ID: %v", err)
		}
		ordererAvatarURL = url
	}

	ordererResp := presenter.PresentOrderer(orderer, ordererAvatarURL)
	response := presenter.PresentDetailedOrder(order, ordererResp, nil)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get sorted orders by receiver link
// @Description Get sorted orders by receiver link
// @Tags orders
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} []resp.OrderWithDecision
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders [get]
func (h *orderHandler) GetSortedOrdersByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetSortedOrdersByUserIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	orders, err := h.orderService.GetSortedByReceiverID(ctx, cmd.UserID, cmd.Sort, cmd.Filters)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var wg sync.WaitGroup

	var ordererAvatarURLs sync.Map
	for _, order := range orders {
		ordererAvatarURLs.Store(order.OrdererID, "")
	}

	for _, order := range orders {
		if order.Orderer.UserID != nil {
			wg.Add(1)
			ordererID := order.OrdererID
			userID := *order.Orderer.UserID
			go func(ordererID uuid.UUID, userID uuid.UUID) {
				defer wg.Done()
				avatarURL, err := h.avatarService.GetAvatarURLByUserID(ctx, userID, cmd.AvatarSize)
				if err != nil {
					logger.WithRequestID(ctx, h.logger).Errorf("failed to get avatar URL by user ID: %v", err)
					return
				}
				ordererAvatarURLs.Store(ordererID, avatarURL)
			}(ordererID, userID)
		}
	}

	var decidedByAvatarURLs sync.Map
	for _, order := range orders {
		if len(order.Decisions) > 0 && order.Decisions[0].DecidedBy != uuid.Nil {
			decidedByAvatarURLs.Store(order.Decisions[0].DecidedBy, "")
		}
	}

	for _, order := range orders {
		if len(order.Decisions) > 0 && order.Decisions[0].DecidedBy != uuid.Nil {
			wg.Add(1)
			decidedBy := order.Decisions[0].DecidedBy
			go func(decidedBy uuid.UUID) {
				defer wg.Done()
				avatarURL, err := h.avatarService.GetAvatarURLByUserID(ctx, decidedBy, cmd.AvatarSize)
				if err != nil {
					logger.WithRequestID(ctx, h.logger).Errorf("failed to get avatar URL by user ID: %v", err)
					return
				}
				decidedByAvatarURLs.Store(decidedBy, avatarURL)
			}(decidedBy)
		}
	}

	wg.Wait()

	contentArray := make([]domain.IContent, len(orders))
	for i, order := range orders {
		contentArray[i] = order.Content
	}
	contentCoverURLs, err := h.contentService.GetContentCoverURLsAsync(ctx, contentArray, cmd.CoverSize)
	if err != nil {
		utils.HttpError(ctx, w, err)
	}

	presented := make([]*resp.OrderWithDecision, len(orders))
	for i, order := range orders {
		var ordererAvatarURL string
		if val, ok := ordererAvatarURLs.Load(order.OrdererID); ok {
			ordererAvatarURL, _ = val.(string)
		}

		var contentResp resp.IContent
		if order.Content != nil {
			contentResp = presenter.PresentContent(order.Content, contentCoverURLs[order.Content.GetID()])
		}

		ordererResp := presenter.PresentOrderer(order.Orderer, ordererAvatarURL)
		orderResp := presenter.PresentDetailedOrder(order, ordererResp, contentResp)
		var decisionResp *resp.OrderDecision
		if len(order.Decisions) > 0 {
			var contentNoteResp resp.IContentNote
			if order.Decisions[0].ContentNote != nil {
				contentNoteResp = presenter.PresentContentNote(order.Decisions[0].ContentNote, nil)
			}
			var decidedByAvatarURL string
			if val, ok := decidedByAvatarURLs.Load(order.Decisions[0].DecidedBy); ok {
				decidedByAvatarURL, _ = val.(string)
			}
			decidedByResp := presenter.PresentUser(order.Decisions[0].DecidedByUser, decidedByAvatarURL)
			decisionResp = presenter.PresentOrderDecision(order.Decisions[0], contentNoteResp, decidedByResp)
		}
		presented[i] = &resp.OrderWithDecision{
			DetailedOrder: orderResp,
			Decision:      decisionResp,
		}
	}

	utils.WriteHttpJsonResponse(ctx, w, presented)
}

// @Summary Create a suggestion order
// @Description Create a suggestion order
// @Tags orders
// @Accept json
// @Produce json
// @Param createOrderReq body requests.CreateOrder true "Create order request"
// @Param userId path string true "User ID"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders/suggest [post]
func (h *orderHandler) CreatePickleSuggestionOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, ordererCmd, err := binders.BindPickleSuggestionOrderCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	_, err = h.createOrderUseCase.Handle(ctx, cmd, ordererCmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Create an order
// @Description Create an order
// @Tags orders
// @Accept json
// @Produce json
// @Param createOrderReq body requests.CreateOrder true "Create order request"
// @Param userId path string true "User ID"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/webhooks/orders/{userId} [post]
func (h *orderHandler) CreateOrderWebhook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, ordererCmd, err := binders.BindWebhookCreateOrderCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	_, err = h.createOrderUseCase.Handle(ctx, cmd, ordererCmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Approve an order
// @Description Approve an order
// @Tags orders
// @Accept json
// @Produce json
// @Param orderId path string true "Order ID"
// @Param locale query string true "Locale"
// @Success 200 {object} resp.OrderWithDecision
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders/{orderId}/approve [post]
func (h *orderHandler) ApproveOrderByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindApproveOrderCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.HasPermission(ctx, cmd.ReceiverID, authUserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, utils.NewInternalServerError("failed to check permission", err))
		return
	}

	if !hasPermission {
		utils.HttpError(ctx, w, utils.NewForbiddenError("User is not allowed to update the order", nil))
		return
	}

	isOrderDecisionExists, err := h.orderService.IsOrderDecisionExistsByOrderID(ctx, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if isOrderDecisionExists {
		utils.HttpBusinessError(ctx, w, "Order decision already exists for this order", http.StatusBadRequest)
		return
	}

	approver, err := h.userService.GetUserByID(ctx, authUserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	order, err := h.orderService.GetOrderByIDWithOrderer(ctx, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	content, err := h.contentService.GetDetailedContentByID(ctx, cmd.ContentCategory, cmd.ContentID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	relatedNote, err := h.contentNoteService.GetDetailedContentNoteByContentID(ctx, cmd.ContentCategory, cmd.ContentID, cmd.ReceiverID)
	if err != nil && (err.(*utils.CustomError).HttpStatus != http.StatusNotFound) {
		utils.HttpError(ctx, w, err)
		return
	}

	var orderDecision *domain.OrderDecision
	err = h.sqlDb.BeginTx(ctx, func(tx sql.Queries) error {
		if relatedNote == nil {
			ordererCmd := &commands.CreateOrdererCommand{
				UserID:          order.Orderer.UserID,
				Source:          order.Orderer.Source,
				DisplayName:     order.Orderer.DisplayName,
				ReferenceUserID: order.Orderer.ReferenceUserID,
			}
			contentNoteCmd := &commands.CreateContentNoteCommand{
				UserID:    approver.ID,
				ContentID: cmd.ContentID,
				Category:  cmd.ContentCategory,
				Orderer:   ordererCmd,
			}
			note, err := h.contentNoteService.CreateContentNote(ctx, tx, content, order.Orderer, contentNoteCmd)
			if err != nil {
				return err
			}
			relatedNote = note
		}

		orderDecision, err = h.orderService.ApproveOrderByID(ctx, tx, order, approver, relatedNote)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var (
		ordererAvatarURL   string
		decidedByAvatarURL string
		contentCoverURL    *string
		wg                 sync.WaitGroup
	)

	if order.Orderer.UserID != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ordererAvatarURL, err = h.avatarService.GetAvatarURLByUserID(ctx, *order.Orderer.UserID, cmd.AvatarSize)
			if err != nil {
				logger.WithRequestID(ctx, h.logger).Errorf("failed to get orderer avatar URL: %v", err)
			}
		}()
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		decidedByAvatarURL, err = h.avatarService.GetAvatarURLByUserID(ctx, approver.ID, cmd.AvatarSize)
		if err != nil {
			logger.WithRequestID(ctx, h.logger).Errorf("failed to get decided by avatar URL: %v", err)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		contentCoverURL = h.contentService.GetContentCoverURL(ctx, relatedNote.GetContent(), cmd.CoverSize)
	}()

	ordererResp := presenter.PresentOrderer(order.Orderer, ordererAvatarURL)
	decidedByResp := presenter.PresentUser(approver, decidedByAvatarURL)
	relatedNoteResp := presenter.PresentDetailedContentNote(relatedNote, ordererResp, contentCoverURL)
	decisionResp := presenter.PresentOrderDecision(orderDecision, relatedNoteResp, decidedByResp)
	orderResp := presenter.PresentDetailedOrder(order, ordererResp, nil)
	resp := &resp.OrderWithDecision{
		DetailedOrder: orderResp,
		Decision:      decisionResp,
	}
	utils.WriteHttpJsonResponse(ctx, w, resp)
}

// @Summary Reject an order
// @Description Reject an order
// @Tags orders
// @Accept json
// @Produce json
// @Param orderId path string true "Order ID"
// @Success 200 {object} resp.OrderWithDecision
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders/{orderId}/reject [post]
func (h *orderHandler) RejectOrderByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindRejectOrderCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.HasPermission(ctx, cmd.ReceiverID, authUserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, utils.NewInternalServerError("failed to check permission", err))
		return
	}

	if !hasPermission {
		utils.HttpError(ctx, w, utils.NewForbiddenError("User is not allowed to update the order", nil))
		return
	}

	isOrderDecisionExists, err := h.orderService.IsOrderDecisionExistsByOrderID(ctx, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if isOrderDecisionExists {
		utils.HttpBusinessError(ctx, w, "Order decision already exists for this order", http.StatusBadRequest)
		return
	}

	initiator, err := h.userService.GetUserByID(ctx, authUserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	order, err := h.orderService.GetOrderByID(ctx, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	orderDecision, err := h.orderService.RejectOrderByID(ctx, h.sqlDb.Queries(), order, initiator)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	avatarURL, err := h.avatarService.GetAvatarURLByUserID(ctx, initiator.ID, cmd.AvatarSize)
	if err != nil {
		logger.WithRequestID(ctx, h.logger).Errorf("failed to get initiator avatar URL: %v", err)
	}

	initiatorResp := presenter.PresentUser(initiator, avatarURL)
	decisionResp := presenter.PresentOrderDecision(orderDecision, nil, initiatorResp)
	orderResp := presenter.PresentDetailedOrder(order, nil, nil)
	resp := &resp.OrderWithDecision{
		DetailedOrder: orderResp,
		Decision:      decisionResp,
	}
	utils.WriteHttpJsonResponse(ctx, w, resp)
}
