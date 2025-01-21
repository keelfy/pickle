package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type OrderHandler interface {
	GetOrderByID(w http.ResponseWriter, r *http.Request)
	GetSortedOrdersByUserID(w http.ResponseWriter, r *http.Request)
	CreateOrder(w http.ResponseWriter, r *http.Request)
	UpdateOrderByID(w http.ResponseWriter, r *http.Request)
}

type orderHandler struct {
	orderService   services.OrderService
	userService    services.ProfileService
	contentService services.ContentService
}

func NewOrdersHandler(orderService services.OrderService, userService services.ProfileService, contentService services.ContentService) OrderHandler {
	return &orderHandler{
		orderService:   orderService,
		userService:    userService,
		contentService: contentService,
	}
}

// @Summary Get order by ID
// @Description Get order by ID
// @Tags orders
// @Accept json
// @Produce json
// @Param orderId path string true "Order ID"
// @Param userId path string true "User ID"
// @Success 200 {object} types.OrderRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders/{orderId} [get]
func (handler *orderHandler) GetOrderByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	orderId, err := utils.ReadPathUUIDVariable("orderId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	order, err := handler.orderService.GetOrderById(ctx, orderId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.OrderRes{}
	copier.Copy(response, order)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get sorted orders by receiver link
// @Description Get sorted orders by receiver link
// @Tags orders
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} []types.OrderRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders [get]
func (handler *orderHandler) GetSortedOrdersByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Extracting query parameters
	sort, err := utils.GetSortedPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Find receiver by link
	receiver, err := handler.userService.GetProfileById(ctx, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orders, err := handler.orderService.GetSortedByReceiverId(ctx, receiver.UserID, sort)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &[]types.OrderRes{}
	copier.Copy(response, orders)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Create an order
// @Description Create an order
// @Tags orders
// @Accept json
// @Produce json
// @Param createOrderReq body types.CreateOrderReq true "Create order request"
// @Param userId path string true "User ID"
// @Success 200 {object} types.OrderRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders [post]
func (handler *orderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Unmarshal request body
	req := &types.CreateOrderReq{}
	json.NewDecoder(r.Body).Decode(req)

	// Extract JWT token from the request
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)

	createdOrder, err := handler.orderService.CreateOrder(ctx, userId, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orderResponse := &types.OrderRes{}
	copier.Copy(orderResponse, createdOrder)
	utils.WriteHttpJsonResponse(ctx, w, orderResponse)
}

// @Summary Update an order
// @Description Update an order
// @Tags orders
// @Accept json
// @Produce json
// @Param orderId path string true "Order ID"
// @Param orderReq body types.OrderReq true "Order request"
// @Success 200 {object} types.OrderRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/orders/{orderId} [put]
func (handler *orderHandler) UpdateOrderByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)

	link, err := utils.ReadPathVariable("link", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orderId, err := utils.ReadPathUUIDVariable("orderId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req := &types.OrderReq{}
	err = json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	var (
		g         errgroup.Group
		receiver  *db.Profile
		initiator *db.Profile
	)

	g.Go(func() error {
		receiver, err = handler.userService.GetProfileByLink(ctx, link)
		return nil
	})

	g.Go(func() error {
		initiator, err = handler.userService.GetProfileById(ctx, userId)
		return nil
	})

	err = g.Wait()
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	updatedOrder, err := handler.orderService.UpdateOrderByID(ctx, orderId, initiator, receiver, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orderResponse := &types.OrderRes{}
	copier.Copy(orderResponse, updatedOrder)
	utils.WriteHttpJsonResponse(ctx, w, orderResponse)
}
