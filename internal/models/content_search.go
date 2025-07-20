package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNoteSearchResult interface {
	GetID() uuid.UUID
	GetTitle() string
	GetCategory() db.ContentCategory
	GetStatus() string
	GetCreatedAt() time.Time
	GetInitialOrdererUserID() uuid.UUID
	GetInitialOrdererDisplayName() string
	GetOrdererCount() int64
	GetCoverKey() string
	GetCoverKeyType() db.NullImageKeyType
}

type BasicNoteSearchResult struct {
	ID                        uuid.UUID           `json:"id"`
	CreatedAt                 time.Time           `json:"createdAt"`
	Title                     string              `json:"title"`
	Status                    db.GameNoteStatus   `json:"status"`
	Rate                      *int16              `json:"rate,omitempty"`
	Comment                   *string             `json:"comment,omitempty"`
	InitialOrdererUserID      uuid.UUID           `json:"initialOrdererUserId"`
	InitialOrdererDisplayName string              `json:"initialOrdererDisplayName"`
	OrdererCount              int64               `json:"ordererCount"`
	CoverKey                  string              `json:"coverKey"`
	CoverKeyType              db.NullImageKeyType `json:"coverKeyType"`
}

func (b *BasicNoteSearchResult) GetID() uuid.UUID {
	return b.ID
}

func (b *BasicNoteSearchResult) GetTitle() string {
	return b.Title
}

func (b *BasicNoteSearchResult) GetStatus() string {
	return string(b.Status)
}

func (b *BasicNoteSearchResult) GetCreatedAt() time.Time {
	return b.CreatedAt
}

func (b *BasicNoteSearchResult) GetInitialOrdererUserID() uuid.UUID {
	return b.InitialOrdererUserID
}

func (b *BasicNoteSearchResult) GetInitialOrdererDisplayName() string {
	return b.InitialOrdererDisplayName
}

func (b *BasicNoteSearchResult) GetOrdererCount() int64 {
	return b.OrdererCount
}

func (b *BasicNoteSearchResult) GetCoverKey() string {
	return b.CoverKey
}

func (b *BasicNoteSearchResult) GetCoverKeyType() db.NullImageKeyType {
	return b.CoverKeyType
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
