package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNoteSearchResult interface {
	GetID() uuid.UUID
	GetName() string
	GetCategory() db.ContentCategory
	GetStatus() string
	GetCreatedAt() time.Time
	GetInitialOrdererUsername() string
	GetOrdererCount() int64
	GetPosterKey() *string
	GetPosterUpdatedAt() time.Time
}

type BasicNoteSearchResult struct {
	ID                     uuid.UUID         `json:"id"`
	CreatedAt              time.Time         `json:"createdAt"`
	Name                   string            `json:"name"`
	Status                 db.GameNoteStatus `json:"status"`
	Rate                   *int16            `json:"rate,omitempty"`
	Comment                *string           `json:"comment,omitempty"`
	InitialOrdererUsername string            `json:"initialOrdererUsername"`
	OrdererCount           int64             `json:"ordererCount"`
	PosterKey              *string           `json:"posterKey,omitempty"`
	PosterUpdatedAt        *time.Time        `json:"posterUpdatedAt,omitempty"`
}

func (b *BasicNoteSearchResult) GetID() uuid.UUID {
	return b.ID
}

func (b *BasicNoteSearchResult) GetName() string {
	return b.Name
}

func (b *BasicNoteSearchResult) GetStatus() string {
	return string(b.Status)
}

func (b *BasicNoteSearchResult) GetCreatedAt() time.Time {
	return b.CreatedAt
}

func (b *BasicNoteSearchResult) GetInitialOrdererUsername() string {
	return b.InitialOrdererUsername
}

func (b *BasicNoteSearchResult) GetOrdererCount() int64 {
	return b.OrdererCount
}

func (b *BasicNoteSearchResult) GetPosterKey() *string {
	return b.PosterKey
}

func (b *BasicNoteSearchResult) GetPosterUpdatedAt() time.Time {
	return *b.PosterUpdatedAt
}

type GameNoteSearchResult struct {
	BasicNoteSearchResult
	ReleaseDate  *time.Time `json:"releaseDate,omitempty"`
	LastPlayedAt *time.Time `json:"lastPlayedAt,omitempty"`
}

func (g *GameNoteSearchResult) GetCategory() db.ContentCategory {
	return db.ContentCategoryGames
}

type MovieNoteSearchResult struct {
	BasicNoteSearchResult
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
	WatchedAt   *time.Time `json:"watchedAt,omitempty"`
}

func (m *MovieNoteSearchResult) GetCategory() db.ContentCategory {
	return db.ContentCategoryMovies
}
