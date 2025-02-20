package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNote interface {
	GetID() uuid.UUID
	GetName() string
	GetUserID() uuid.UUID
	GetCategory() db.ContentCategory
	GetStatus() string
	GetCreatedAt() time.Time
	GetInitialOrdererID() uuid.UUID
	GetPosterKey() *string
	GetPosterUpdatedAt() time.Time
}

type GameNote struct {
	db.GameNote
}

func (g *GameNote) GetID() uuid.UUID {
	return g.ID
}

func (g *GameNote) GetName() string {
	return g.Name
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

func (g *GameNote) GetPosterKey() *string {
	return g.PosterKey
}

func (g *GameNote) GetPosterUpdatedAt() time.Time {
	return g.PosterUpdatedAt
}

type MovieNote struct {
	db.MovieNote
}

func (m *MovieNote) GetID() uuid.UUID {
	return m.ID
}

func (m *MovieNote) GetName() string {
	return m.Name
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

func (m *MovieNote) GetPosterKey() *string {
	return m.PosterKey
}

func (m *MovieNote) GetPosterUpdatedAt() time.Time {
	return m.PosterUpdatedAt
}
