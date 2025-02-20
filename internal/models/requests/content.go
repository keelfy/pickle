package requests

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type ContentNoteNameReq struct {
	Name string `json:"name"`
}

func (req *ContentNoteNameReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.Required, validation.Length(1, 100)),
	)
}

type CreateContentNoteReq interface {
	GetName() string
	GetStatus() string
	GetPosterPreviewID() *uuid.UUID
	GetRate() *int16
	GetComment() *string
}

type CreateGameNoteReq struct {
	Name            string            `json:"name"`
	Link            *string           `json:"link"`
	ReleaseDate     *time.Time        `json:"releaseDate"`
	Rate            *int16            `json:"rate"`
	Comment         *string           `json:"comment"`
	Status          db.GameNoteStatus `json:"status"`
	LastPlayedAt    *time.Time        `json:"lastPlayedAt"`
	PosterPreviewID *uuid.UUID        `json:"posterPreviewId"`
}

func (req *CreateGameNoteReq) GetName() string {
	return req.Name
}

func (req *CreateGameNoteReq) GetStatus() string {
	return string(req.Status)
}

func (req *CreateGameNoteReq) GetPosterPreviewID() *uuid.UUID {
	return req.PosterPreviewID
}

func (req *CreateGameNoteReq) GetRate() *int16 {
	return req.Rate
}

func (req *CreateGameNoteReq) GetComment() *string {
	return req.Comment
}

var isGameNoteStatus = validation.In(db.GameNoteStatusDropped, db.GameNoteStatusFinished, db.GameNoteStatusPlaying, db.GameNoteStatusPlanned, db.GameNoteStatusSkipped, db.GameNoteStatusPaused)

func (req *CreateGameNoteReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.Required, validation.Length(1, 100)),
		validation.Field(&req.Link, validation.NilOrNotEmpty, is.URL),
		validation.Field(&req.ReleaseDate, validation.NilOrNotEmpty, is2.IsRFC3339Date),
		validation.Field(&req.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&req.Comment, validation.NilOrNotEmpty, validation.Length(0, 1000)),
		validation.Field(&req.Status, validation.Required, isGameNoteStatus),
		validation.Field(&req.LastPlayedAt, validation.NilOrNotEmpty, is2.IsRFC3339Date),
		validation.Field(&req.PosterPreviewID, validation.NilOrNotEmpty, is.UUID),
	)
}

type CreateMovieNoteReq struct {
	Name            string             `json:"name"`
	ReleaseDate     *time.Time         `json:"releaseDate"`
	Rate            *int16             `json:"rate"`
	Comment         *string            `json:"comment"`
	Status          db.MovieNoteStatus `json:"status"`
	WatchedAt       *time.Time         `json:"watchedAt"`
	PosterPreviewID *uuid.UUID         `json:"posterPreviewId"`
}

func (req *CreateMovieNoteReq) GetName() string {
	return req.Name
}

func (req *CreateMovieNoteReq) GetStatus() string {
	return string(req.Status)
}

func (req *CreateMovieNoteReq) GetPosterPreviewID() *uuid.UUID {
	return req.PosterPreviewID
}

func (req *CreateMovieNoteReq) GetRate() *int16 {
	return req.Rate
}

func (req *CreateMovieNoteReq) GetComment() *string {
	return req.Comment
}

var isMovieNoteStatus = validation.In(db.MovieNoteStatusDropped, db.MovieNoteStatusPlanned, db.MovieNoteStatusSkipped, db.MovieNoteStatusWatched)

func (req *CreateMovieNoteReq) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Name, validation.Required, validation.Length(1, 100)),
		validation.Field(&req.ReleaseDate, validation.NilOrNotEmpty, is2.IsRFC3339Date),
		validation.Field(&req.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&req.Comment, validation.NilOrNotEmpty, validation.Length(0, 1000)),
		validation.Field(&req.Status, validation.Required, isMovieNoteStatus),
		validation.Field(&req.WatchedAt, validation.NilOrNotEmpty, is2.IsRFC3339Date),
		validation.Field(&req.PosterPreviewID, validation.NilOrNotEmpty, is.UUID),
	)
}
