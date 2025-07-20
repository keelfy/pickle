package requests

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type CreateContentNoteReq interface {
	GetContentID() uuid.UUID
	GetStatus() string
	GetRate() *int16
	GetComment() *string
}

type CreateGameNoteReq struct {
	ContentID    uuid.UUID         `json:"contentId"`
	Rate         *int16            `json:"rate"`
	Comment      *string           `json:"comment"`
	Status       db.GameNoteStatus `json:"status"`
	LastPlayedAt *time.Time        `json:"lastPlayedAt"`
}

func (req *CreateGameNoteReq) GetStatus() string {
	return string(req.Status)
}

func (req *CreateGameNoteReq) GetRate() *int16 {
	return req.Rate
}

func (req *CreateGameNoteReq) GetComment() *string {
	return req.Comment
}

func (req *CreateGameNoteReq) GetContentID() uuid.UUID {
	return req.ContentID
}

var isGameNoteStatus = validation.In(db.GameNoteStatusDropped, db.GameNoteStatusFinished, db.GameNoteStatusPlaying, db.GameNoteStatusPlanned, db.GameNoteStatusSkipped, db.GameNoteStatusPaused)

func (req *CreateGameNoteReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&req.Comment, validation.NilOrNotEmpty, validation.Length(0, 1000)),
		validation.Field(&req.Status, validation.Required, isGameNoteStatus),
		validation.Field(&req.LastPlayedAt, validation.NilOrNotEmpty, is2.IsRFC3339Date),
		validation.Field(&req.ContentID, validation.Required, is.UUID),
	)
}

type CreateMovieNoteReq struct {
	Rate      *int16             `json:"rate"`
	Comment   *string            `json:"comment"`
	Status    db.MovieNoteStatus `json:"status"`
	WatchedAt *time.Time         `json:"watchedAt"`
	ContentID uuid.UUID          `json:"contentId"`
}

func (req *CreateMovieNoteReq) GetStatus() string {
	return string(req.Status)
}

func (req *CreateMovieNoteReq) GetRate() *int16 {
	return req.Rate
}

func (req *CreateMovieNoteReq) GetComment() *string {
	return req.Comment
}

func (req *CreateMovieNoteReq) GetContentID() uuid.UUID {
	return req.ContentID
}

var isMovieNoteStatus = validation.In(db.MovieNoteStatusDropped, db.MovieNoteStatusPlanned, db.MovieNoteStatusSkipped, db.MovieNoteStatusWatched)

func (req *CreateMovieNoteReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&req.Comment, validation.NilOrNotEmpty, validation.Length(0, 1000)),
		validation.Field(&req.Status, validation.Required, isMovieNoteStatus),
		validation.Field(&req.WatchedAt, validation.NilOrNotEmpty, is2.IsRFC3339Date),
		validation.Field(&req.ContentID, validation.Required, is.UUID),
	)
}
