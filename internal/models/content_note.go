package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNote interface {
	GetID() uuid.UUID
	GetUserID() uuid.UUID
	GetCategory() db.ContentCategory
	GetStatus() string
	GetCreatedAt() time.Time
	GetUpdatedAt() time.Time
	GetRate() *int16
	GetComment() *string
	GetInitialOrdererID() uuid.UUID
	GetContent() Content
}

type GameNote struct {
	ID               uuid.UUID         `json:"id"`
	UserID           uuid.UUID         `json:"userId"`
	InitialOrdererID uuid.UUID         `json:"initialOrdererId"`
	Status           db.GameNoteStatus `json:"status"`
	Rate             *int16            `json:"rate,omitempty"`
	Comment          *string           `json:"comment,omitempty"`
	CreatedAt        time.Time         `json:"createdAt"`
	UpdatedAt        time.Time         `json:"updatedAt"`
	LastPlayedAt     *time.Time        `json:"lastPlayedAt,omitempty"`
	Content          *Game             `json:"content"`
}

func (g *GameNote) GetID() uuid.UUID {
	return g.ID
}

func (g *GameNote) GetUserID() uuid.UUID {
	return g.UserID
}

func (g *GameNote) GetCategory() db.ContentCategory {
	return db.ContentCategoryGames
}

func (g *GameNote) GetInitialOrdererID() uuid.UUID {
	return g.InitialOrdererID
}

func (g *GameNote) GetStatus() string {
	return string(g.Status)
}

func (g *GameNote) GetCreatedAt() time.Time {
	return g.CreatedAt
}

func (g *GameNote) GetUpdatedAt() time.Time {
	return g.UpdatedAt
}

func (g *GameNote) GetRate() *int16 {
	return g.Rate
}

func (g *GameNote) GetComment() *string {
	return g.Comment
}

func (g *GameNote) GetContent() Content {
	return g.Content
}

type DetailedGameNote struct {
	GameNote
}

type MovieNote struct {
	ID               uuid.UUID          `json:"id"`
	UserID           uuid.UUID          `json:"userId"`
	InitialOrdererID uuid.UUID          `json:"initialOrdererId"`
	Status           db.MovieNoteStatus `json:"status"`
	Rate             *int16             `json:"rate,omitempty"`
	Comment          *string            `json:"comment,omitempty"`
	CreatedAt        time.Time          `json:"createdAt"`
	UpdatedAt        time.Time          `json:"updatedAt"`
	WatchedAt        *time.Time         `json:"watchedAt,omitempty"`
	Content          *Movie             `json:"content"`
}

func (m *MovieNote) GetID() uuid.UUID {
	return m.ID
}

func (m *MovieNote) GetUserID() uuid.UUID {
	return m.UserID
}

func (m *MovieNote) GetCategory() db.ContentCategory {
	return db.ContentCategoryMovies
}

func (m *MovieNote) GetInitialOrdererID() uuid.UUID {
	return m.InitialOrdererID
}

func (m *MovieNote) GetStatus() string {
	return string(m.Status)
}

func (m *MovieNote) GetCreatedAt() time.Time {
	return m.CreatedAt
}

func (m *MovieNote) GetUpdatedAt() time.Time {
	return m.UpdatedAt
}

func (m *MovieNote) GetRate() *int16 {
	return m.Rate
}

func (m *MovieNote) GetComment() *string {
	return m.Comment
}

func (m *MovieNote) GetContent() Content {
	return m.Content
}
