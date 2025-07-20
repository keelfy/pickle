package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type Order struct {
	ID          uuid.UUID          `json:"id"`
	CreatedAt   time.Time          `json:"created_at"`
	CreatedBy   *uuid.UUID         `json:"created_by"`
	UpdatedAt   time.Time          `json:"updated_at"`
	UpdatedBy   *uuid.UUID         `json:"updated_by"`
	ReceiverID  uuid.UUID          `json:"receiver_id"`
	PaymentType int16              `json:"payment_type"`
	Amount      float32            `json:"amount"`
	Status      db.OrderStatus     `json:"status"`
	OrdererID   uuid.UUID          `json:"orderer_id"`
	Message     string             `json:"message"`
	Category    db.ContentCategory `json:"category"`
	Anonymous   bool               `json:"anonymous"`
	Source      string             `json:"source"`
	Reference   []byte             `json:"reference"`
	//
	OrdererDisplayName *string `json:"ordererDisplayName"`
}
