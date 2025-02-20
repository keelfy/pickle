package responses

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNoteRes interface {
	GetID() uuid.UUID
	GetCreatedAt() time.Time
	GetName() string
	GetStatus() string

	SetPosterURL(url string)
}

type GameNoteRes struct {
	ID           uuid.UUID         `json:"id"`
	CreatedAt    time.Time         `json:"createdAt"`
	UserID       uuid.UUID         `json:"userId"`
	Name         string            `json:"name"`
	Link         *string           `json:"link,omitempty"`
	ReleaseDate  *time.Time        `json:"releaseDate,omitempty"`
	Rate         *int16            `json:"rate,omitempty"`
	Comment      *string           `json:"comment,omitempty"`
	Ordered      bool              `json:"ordered"`
	Status       db.GameNoteStatus `json:"status"`
	LastPlayedAt *time.Time        `json:"lastPlayedAt,omitempty"`
	PosterURL    string            `json:"posterUrl,omitempty"`
	OrdererCount int64             `json:"ordererCount"`
}

func (g *GameNoteRes) GetID() uuid.UUID {
	return g.ID
}

func (g *GameNoteRes) GetCreatedAt() time.Time {
	return g.CreatedAt
}

func (g *GameNoteRes) GetName() string {
	return g.Name
}

func (g *GameNoteRes) GetStatus() string {
	return string(g.Status)
}

func (g *GameNoteRes) SetPosterURL(url string) {
	g.PosterURL = url
}

type MovieNoteRes struct {
	ID           uuid.UUID          `json:"id"`
	CreatedAt    time.Time          `json:"createdAt"`
	UserID       uuid.UUID          `json:"userId"`
	Name         string             `json:"name"`
	Link         *string            `json:"link,omitempty"`
	ReleaseDate  *time.Time         `json:"releaseDate,omitempty"`
	Rate         *int16             `json:"rate,omitempty"`
	Comment      *string            `json:"comment,omitempty"`
	Ordered      bool               `json:"ordered"`
	Status       db.MovieNoteStatus `json:"status"`
	WatchedAt    *time.Time         `json:"watchedAt,omitempty"`
	PosterURL    string             `json:"posterUrl,omitempty"`
	OrdererCount int64              `json:"ordererCount"`
}

func (m *MovieNoteRes) GetID() uuid.UUID {
	return m.ID
}

func (m *MovieNoteRes) GetCreatedAt() time.Time {
	return m.CreatedAt
}

func (m *MovieNoteRes) GetName() string {
	return m.Name
}

func (m *MovieNoteRes) GetStatus() string {
	return string(m.Status)
}

func (m *MovieNoteRes) SetPosterURL(url string) {
	m.PosterURL = url
}
