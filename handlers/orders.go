package handlers

import (
	"encoding/json"
	"log"
	"math"
	"net/http"

	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/models"
	"github.com/pickle.pw/monolith/repo"
	"github.com/pickle.pw/monolith/types"
	"github.com/pickle.pw/monolith/utils"
)

type Order struct {
	userRepo  *repo.Users
	orderRepo *repo.Orders
}

func NewOrdersHandler(userRepo *repo.Users, orderRepo *repo.Orders) *Order {
	return &Order{userRepo: userRepo, orderRepo: orderRepo}
}

func (h *Order) GetOrdersByLink(w http.ResponseWriter, r *http.Request) {
	var orders *[]models.Order
	var totalElements int

	from, to, page, size := utils.GetPagination(r)
	receiverLink := r.PathValue("link")
	receiver, err := h.userRepo.GetUserByLink(receiverLink)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	tkn, err := utils.ExtractJWTToken(r)
	if err == nil {
		userId, err := tkn.Claims.GetSubject()
		if err != nil || len(userId) == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		orders, totalElements, err = h.orderRepo.GetOrders(receiver.Id, from, to)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	} else {
		orders, totalElements, err = h.orderRepo.GetLastOrders(receiver.Id, 5)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	orderResponses := &[]types.OrderRes{}
	response := &types.PaginatedRes[types.OrderRes]{}
	copier.Copy(orderResponses, orders)

	response.Content = *orderResponses
	response.Page = page
	response.Size = size
	response.TotalElements = totalElements

	if size > 0 && totalElements > 0 {
		response.TotalPages = int(math.Ceil(float64(totalElements) / float64(size)))
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
}

func (h *Order) ApproveOrder(w http.ResponseWriter, r *http.Request) {

}
