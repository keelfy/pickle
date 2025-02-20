package types

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
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

func (req *UpdateProfileReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Username, validation.Required, validation.Length(1, 50)),
		validation.Field(&req.Link, validation.NilOrNotEmpty, validation.Length(0, 50)),
		validation.Field(&req.Description, validation.NilOrNotEmpty, validation.Length(0, 1000)),
	)
}

type ReactionReq struct {
	EmoteID string `json:"emoteId"`
	Source  string `json:"source"`
}

func (req *ReactionReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.EmoteID, validation.Required, validation.Length(1, 100)),
		validation.Field(&req.Source, validation.Required, is2.IsReactionSource),
	)
}

type PosterReq struct {
	PreviewID *uuid.UUID `json:"previewId"`
}

func (req *PosterReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.PreviewID, validation.NilOrNotEmpty, is.UUID),
	)
}

type CreateOrderReq struct {
	OrdererUsername string             `json:"ordererUsername"`
	IsAnonymously   bool               `json:"isAnonymously"`
	Category        db.ContentCategory `json:"category"`
	Message         string             `json:"message"`
}

func (req *CreateOrderReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.OrdererUsername, validation.NilOrNotEmpty, validation.Length(0, 50)),
		validation.Field(&req.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&req.Message, validation.NilOrNotEmpty, validation.Length(0, 150)),
	)
}

type OrderReq struct {
	Status    db.OrderStatus      `json:"status"`
	Title     *string             `json:"title,omitempty"`
	Category  *db.ContentCategory `json:"category,omitempty"`
	ContentID *uuid.UUID          `json:"contentId,omitempty"`
}

func (req *OrderReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Status, validation.Required, is2.IsOrderStatus),
		validation.Field(&req.Title, validation.NilOrNotEmpty, validation.Length(1, 100)),
		validation.Field(&req.Category, validation.NilOrNotEmpty, is2.IsContentCategory),
		validation.Field(&req.ContentID, validation.NilOrNotEmpty, is.UUID),
	)
}

type CreateCollectionReq struct {
	Name string `json:"name"`
}

func (req *CreateCollectionReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.Required, validation.Length(1, 50)),
	)
}

type UpdateCollectionReq struct {
	Name *string `json:"name"`
}

func (req *UpdateCollectionReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.NilOrNotEmpty, validation.Length(1, 50)),
	)
}

type AddItemToCollectionReq struct {
	NoteID   uuid.UUID          `json:"noteId"`
	Category db.ContentCategory `json:"category"`
}

func (req *AddItemToCollectionReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.NoteID, validation.Required, is.UUID),
		validation.Field(&req.Category, validation.Required, is2.IsContentCategory),
	)
}

type AddModeratorReq struct {
	UserLink string `json:"userLink"`
}

func (req *AddModeratorReq) Validate() error {
	return validation.ValidateStruct(req, validation.Field(&req.UserLink, validation.Required, validation.Min(1)))
}
