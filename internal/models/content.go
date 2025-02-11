package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type Content interface {
	GetID() uuid.UUID
	GetName() string
	GetUserID() uuid.UUID
	GetCategory() db.ContentCategory
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

func (g *GameNote) GetPosterKey() *string {
	return g.PosterKey
}

func (g *GameNote) GetPosterUpdatedAt() time.Time {
	return g.PosterUpdatedAt
}
