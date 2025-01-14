package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type Order struct {
	orderService *services.Order
	userService  *services.Profile
}

func NewOrdersHandler(orderService *services.Order, userService *services.Profile) *Order {
	return &Order{
		orderService: orderService,
		userService:  userService,
	}
}

func (handler *Order) GetSortedOrdersByLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extracting path variables
	receiverLink, err := utils.ReadPathVariable("link", r)
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
	receiver, err := handler.userService.GetProfileByLink(ctx, receiverLink)
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
	utils.WriteHttpJsonResponse(w, response)
}

func (handler *Order) CreateOrder(w http.ResponseWriter, r *http.Request) {
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
	utils.WriteHttpJsonResponse(w, orderResponse)
}

func (handler *Order) UpdateOrderById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extracting path variables
	orderId, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Extract JWT token from the request
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)

	req := &types.UpdateOrderReq{}
	json.NewDecoder(r.Body).Decode(req)

	updatedOrder, err := handler.orderService.UpdateOrderById(ctx, orderId, req, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orderResponse := &types.OrderRes{}
	copier.Copy(orderResponse, updatedOrder)
	utils.WriteHttpJsonResponse(w, orderResponse)
}

func (handler *Order) ApproveOrderById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	gameNoteId, err := utils.ReadPathUUIDVariable("gameNoteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Extracting path variables
	orderId, err := utils.ReadPathUUIDVariable("orderId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Extract JWT token from the request
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)

	approvedOrder, err := handler.orderService.ApproveOrderById(ctx, orderId, gameNoteId, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orderResponse := &types.OrderRes{}
	copier.Copy(orderResponse, approvedOrder)
	utils.WriteHttpJsonResponse(w, orderResponse)
}
