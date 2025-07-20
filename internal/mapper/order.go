package mapper

import (
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/models"
)

func MapDBOrderToModel(order *db.Order, ordererDisplayName *string) *models.Order {
	return &models.Order{
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
		OrdererDisplayName: ordererDisplayName,
	}
}
