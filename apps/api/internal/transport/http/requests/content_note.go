package requests

import (
	"time"

	"github.com/google/uuid"
)

type ICreateContentNoteReq interface {
	GetContentID() uuid.UUID
	GetStatus() *string
	GetRate() *int16
	GetComment() string
}

type CreateContentNoteReq struct {
	ContentID uuid.UUID `json:"contentId"`
	Status    *string   `json:"status"`
	Rate      *int16    `json:"rate"`
	Comment   string    `json:"comment"`
}

func (r *CreateContentNoteReq) GetContentID() uuid.UUID {
	return r.ContentID
}

func (r *CreateContentNoteReq) GetStatus() *string {
	return r.Status
}

func (r *CreateContentNoteReq) GetRate() *int16 {
	return r.Rate
}

func (r *CreateContentNoteReq) GetComment() string {
	return r.Comment
}

type CreateGameNoteReq struct {
	*CreateContentNoteReq
	LastPlayedAt *time.Time `json:"lastPlayedAt"`
}

type CreateMovieNoteReq struct {
	*CreateContentNoteReq
	WatchedAt *time.Time `json:"watchedAt"`
}
