package responses

import (
	"time"

	"github.com/google/uuid"
)

type OrderDecision struct {
	ContentNote IContentNote `json:"contentNote,omitempty"`
	DecidedAt   time.Time    `json:"decidedAt"`
	DecidedBy   *User        `json:"decidedBy"`
	Status      string       `json:"status"`
}

type Order struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Source    string    `json:"source"`
	Anonymous bool      `json:"anonymous"`
	Orderer   *Orderer  `json:"orderer,omitempty"`
}

type DetailedOrder struct {
	*Order
	Category string   `json:"category"`
	Content  IContent `json:"content,omitempty"`
	Message  string   `json:"message"`
}

type OrderWithDecision struct {
	*DetailedOrder
	Decision *OrderDecision `json:"decision,omitempty"`
}
