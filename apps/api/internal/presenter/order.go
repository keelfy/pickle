package presenter

import (
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentOrder(order *domain.Order, ordererResp *resp.Orderer) *resp.Order {
	return &resp.Order{
		ID:        order.ID,
		Orderer:   ordererResp,
		CreatedAt: order.CreatedAt,
		Source:    string(order.Source),
		Anonymous: order.Anonymous,
	}
}

func PresentDetailedOrder(order *domain.Order, ordererResp *resp.Orderer, contentResp resp.IContent) *resp.DetailedOrder {
	return &resp.DetailedOrder{
		Order:    PresentOrder(order, ordererResp),
		Category: PresentContentCategory(order.Category),
		Content:  contentResp,
		Message:  order.Message,
	}
}

func PresentOrderDecisionStatus(status domain.OrderDecisionStatus) string {
	return string(status)
}

func PresentOrderDecision(orderDecision *domain.OrderDecision, contentNote resp.IContentNote, decidedBy *resp.User) *resp.OrderDecision {
	return &resp.OrderDecision{
		ContentNote: contentNote,
		DecidedAt:   orderDecision.DecidedAt,
		DecidedBy:   decidedBy,
		Status:      PresentOrderDecisionStatus(orderDecision.Status),
	}
}
