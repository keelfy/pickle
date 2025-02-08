package types

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type CursorSort struct {
	Column    string `json:"column"`
	Direction string `json:"direction"`
	Cursor    any    `json:"cursor"`
	Limit     int    `json:"limit"`
}

type Pagination struct {
	From int
	Size int
	Page int
}

type Filters = map[string]string

type SupabaseWebhookPayload struct {
	Type      string                  `json:"type"`
	Table     string                  `json:"table"`
	Schema    string                  `json:"schema"`
	Record    *map[string]interface{} `json:"record"`
	OldRecord *map[string]interface{} `json:"old_record"`
}

type UpdateProfileReq struct {
	Username    string `json:"username"`
	Link        string `json:"link"`
	Description string `json:"description"`
}

type GameNoteReq struct {
	Name         string            `json:"name"`
	Link         *string           `json:"link"`
	ReleaseDate  *time.Time        `json:"releaseDate"`
	Rate         *int16            `json:"rate"`
	Comment      *string           `json:"comment"`
	Status       db.GameNoteStatus `json:"status"`
	LastPlayedAt *time.Time        `json:"lastPlayedAt"`
	Poster       *PosterReq        `json:"poster"`
}

type ReactionReq struct {
	EmoteID string `json:"emoteId"`
	Source  string `json:"source"`
}

type PosterReq struct {
	PreviewID *uuid.UUID `json:"previewId"`
}

type CreateOrderReq struct {
	ReceiverLink    string             `json:"receiverLink"`
	PaymentType     int16              `json:"paymentType"`
	Amount          float32            `json:"amount"`
	OrdererUsername string             `json:"ordererUsername"`
	Category        db.ContentCategory `json:"category"`
	Message         string             `json:"message"`
}

type OrderReq struct {
	Status    db.OrderStatus      `json:"status"`
	Title     *string             `json:"title,omitempty"`
	Category  *db.ContentCategory `json:"category,omitempty"`
	ContentID *uuid.UUID          `json:"contentId,omitempty"`
}
