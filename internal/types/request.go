package types

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
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

var isRFC3339Date = validation.Date(time.RFC3339)

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

type GameNoteNameReq struct {
	Name string `json:"name"`
}

func (req *GameNoteNameReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.Required, validation.Length(1, 100)),
	)
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

var isGameNoteStatus = validation.In(db.GameNoteStatusDropped, db.GameNoteStatusFinished, db.GameNoteStatusPlaying, db.GameNoteStatusPlanned, db.GameNoteStatusSkipped, db.GameNoteStatusPaused)

func (req *GameNoteReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.Required, validation.Length(1, 100)),
		validation.Field(&req.Link, validation.NilOrNotEmpty, is.URL),
		validation.Field(&req.ReleaseDate, validation.NilOrNotEmpty, isRFC3339Date),
		validation.Field(&req.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&req.Comment, validation.NilOrNotEmpty, validation.Length(0, 1000)),
		validation.Field(&req.Status, validation.Required, isGameNoteStatus),
		validation.Field(&req.LastPlayedAt, validation.NilOrNotEmpty, isRFC3339Date),
		validation.Field(&req.Poster, validation.NilOrNotEmpty, validation.NilOrNotEmpty),
	)
}

type ReactionReq struct {
	EmoteID string `json:"emoteId"`
	Source  string `json:"source"`
}

var isReactionSource = validation.In(db.ReactionSource7tv, db.ReactionSourceCustom, db.ReactionSourceUnicodeEmoji)

func (req *ReactionReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.EmoteID, validation.Required, validation.Length(1, 100)),
		validation.Field(&req.Source, validation.Required, isReactionSource),
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
		validation.Field(&req.Category, validation.Required, isContentCategory),
		validation.Field(&req.Message, validation.NilOrNotEmpty, validation.Length(0, 150)),
	)
}

type OrderReq struct {
	Status    db.OrderStatus      `json:"status"`
	Title     *string             `json:"title,omitempty"`
	Category  *db.ContentCategory `json:"category,omitempty"`
	ContentID *uuid.UUID          `json:"contentId,omitempty"`
}

var isOrderStatus = validation.In(db.OrderStatusApproved, db.OrderStatusRejected)
var isContentCategory = validation.In(db.ContentCategoryGames, db.ContentCategoryMovies, db.ContentCategorySeries, db.ContentCategoryAnime, db.ContentCategoryVideo, db.ContentCategoryCustom)

func (req *OrderReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Status, validation.Required, isOrderStatus),
		validation.Field(&req.Title, validation.NilOrNotEmpty, validation.Length(1, 100)),
		validation.Field(&req.Category, validation.NilOrNotEmpty, isContentCategory),
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
		validation.Field(&req.Category, validation.Required, isContentCategory),
	)
}

type AddModeratorReq struct {
	UserLink string `json:"userLink"`
}

func (req *AddModeratorReq) Validate() error {
	return validation.ValidateStruct(req, validation.Field(&req.UserLink, validation.Required, validation.Min(1)))
}
