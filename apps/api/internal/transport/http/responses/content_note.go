package responses

import (
	"time"

	"github.com/google/uuid"
)

type IContentNote interface {
	GetID() uuid.UUID
	GetUserID() uuid.UUID
	GetContent() IContent
}

type ContentNote struct {
	ID      uuid.UUID `json:"id"`
	UserID  uuid.UUID `json:"userId"`
	Content IContent  `json:"content,omitempty"`
}

func (c *ContentNote) GetID() uuid.UUID {
	return c.ID
}

func (c *ContentNote) GetUserID() uuid.UUID {
	return c.UserID
}

func (c *ContentNote) GetContent() IContent {
	return c.Content
}

type IDetailedContentNote interface {
	IContentNote
	GetCreatedAt() time.Time
	GetRate() *int16
	GetComment() string
	GetStatus() string
	GetOrdererCount() int64
	GetInitialOrderer() *Orderer
}

type DetailedContentNote struct {
	*ContentNote
	CreatedAt      time.Time `json:"createdAt"`
	Rate           *int16    `json:"rate,omitempty"`
	Comment        string    `json:"comment,omitempty"`
	Status         string    `json:"status"`
	OrdererCount   int64     `json:"ordererCount"`
	InitialOrderer *Orderer  `json:"initialOrderer,omitempty"`
}

func (d *DetailedContentNote) GetCreatedAt() time.Time {
	return d.CreatedAt
}

func (d *DetailedContentNote) GetRate() *int16 {
	return d.Rate
}

func (d *DetailedContentNote) GetComment() string {
	return d.Comment
}

func (d *DetailedContentNote) GetStatus() string {
	return d.Status
}

func (d *DetailedContentNote) GetOrdererCount() int64 {
	return d.OrdererCount
}

func (d *DetailedContentNote) GetInitialOrderer() *Orderer {
	return d.InitialOrderer
}

type GameNoteAdditions struct {
	LastPlayedAt *time.Time `json:"lastPlayedAt,omitempty"`
}

type GameNote struct {
	*ContentNote
	Content *Game `json:"content,omitempty"`
}

type DetailedGameNote struct {
	*DetailedContentNote
	*GameNoteAdditions
	Content *DetailedGame `json:"content,omitempty"`
}

type MovieNoteAdditions struct {
	WatchedAt *time.Time `json:"watchedAt,omitempty"`
}

type MovieNote struct {
	*ContentNote
	Content *Movie `json:"content,omitempty"`
}

type DetailedMovieNote struct {
	*DetailedContentNote
	*MovieNoteAdditions
	Content *DetailedMovie `json:"content,omitempty"`
}
