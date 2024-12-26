package handlers

import (
	"encoding/json"
	"log"
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
	userService  *services.User
}

func NewOrdersHandler(orderService *services.Order, userService *services.User) *Order {
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

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &[]types.OrderRes{}
	copier.Copy(response, orders)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
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

	// Response metadata
	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusCreated)

	// Response body
	orderResponse := &types.OrderRes{}
	copier.Copy(orderResponse, createdOrder)
	if err := json.NewEncoder(w).Encode(orderResponse); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
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

	// Response metadata
	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	// Response body
	orderResponse := &types.OrderRes{}
	copier.Copy(orderResponse, updatedOrder)
	if err := json.NewEncoder(w).Encode(orderResponse); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
}
