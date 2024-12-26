package types

import (
	"time"

	"github.com/google/uuid"
)

type SupabaseWebhookPayload struct {
	Type      string                  `json:"type"`
	Table     string                  `json:"table"`
	Schema    string                  `json:"schema"`
	Record    *map[string]interface{} `json:"record"`
	OldRecord *map[string]interface{} `json:"old_record"`
}

type UpdateProfileReq struct {
	Username string `json:"username"`
	Link     string `json:"link"`
}

type GameNoteReq struct {
	Name             string     `json:"name"`
	Link             *string    `json:"link"`
	ReleaseDate      *time.Time `json:"releaseDate"`
	Rate             *int16     `json:"rate"`
	Comment          *string    `json:"comment"`
	Status           int16      `json:"status"`
	CompletionStatus int16      `json:"completionStatus"`
	CompletionDate   time.Time  `json:"completionDate"`
}

type CreateGameNoteReq struct {
	GameNote       *GameNoteReq `json:"gameNote"`
	InitialOrderId uuid.UUID    `json:"initialOrderId"`
}

type CreateOrderReq struct {
	ReceiverLink    string  `json:"receiverLink"`
	PaymentType     int16   `json:"paymentType"`
	Amount          float32 `json:"amount"`
	OrdererUsername string  `json:"ordererUsername"`
	Category        int16   `json:"categoryType"`
	Message         string  `json:"message"`
}

type UpdateOrderReq struct {
	Status int16 `json:"status"`
}

type DenyOrderReq struct {
	OrderId  *uuid.UUID `json:"orderId"`
	UserLink string     `json:"userLink"`
}
