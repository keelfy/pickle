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
	Type      string          `json:"type"`
	Table     string          `json:"table"`
	Schema    string          `json:"schema"`
	Record    *map[string]any `json:"record"`
	OldRecord *map[string]any `json:"old_record"`
}

type UpdateProfileReq struct {
	DisplayName string `json:"displayName"`
	Username    string `json:"username"`
	Description string `json:"description"`
}

func (req *UpdateProfileReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.DisplayName, validation.Required, validation.Length(1, 50)),
		validation.Field(&req.Username, validation.NilOrNotEmpty, validation.Length(0, 50)),
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
	IsAnonymously   bool               `json:"isAnonymously"`
	Category        db.ContentCategory `json:"category"`
	Message         string             `json:"message"`
	Source          string             `json:"source"`
	OrdererUsername string             `json:"ordererUsername"`
	Reference       *string            `json:"reference"`
	ReferenceUserID *string            `json:"referenceUserId"`
}

func (req *CreateOrderReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&req.Message, validation.Required, validation.Length(0, 150)),
		validation.Field(&req.Source, validation.Required, is2.IsOrderSource),
		validation.Field(&req.OrdererUsername, validation.Required, validation.Length(0, 200)),
		validation.Field(&req.Reference, validation.NilOrNotEmpty),
	)
}

type OrderReq struct {
	Status    db.OrderStatus     `json:"status"`
	Category  db.ContentCategory `json:"category"`
	ContentID uuid.UUID          `json:"contentId"`
}

func (req *OrderReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Status, validation.Required, is2.IsOrderStatus),
		validation.Field(&req.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&req.ContentID, validation.Required, is.UUID),
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
