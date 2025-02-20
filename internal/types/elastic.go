package types

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type EsContent struct {
	ID       uuid.UUID          `json:"id"`
	Name     string             `json:"name"`
	UserID   uuid.UUID          `json:"user_id"`
	Category db.ContentCategory `json:"category"`
}

type EsGameNote struct {
	ID          uuid.UUID         `json:"id"`
	Name        string            `json:"name"`
	UserID      uuid.UUID         `json:"user_id"`
	RequestDate time.Time         `json:"request_date"`
	OrdererName string            `json:"orderer"`
	Status      db.GameNoteStatus `json:"status"`
}

type EsMovieNote struct {
	ID          uuid.UUID          `json:"id"`
	Name        string             `json:"name"`
	UserID      uuid.UUID          `json:"user_id"`
	RequestDate time.Time          `json:"request_date"`
	OrdererName string             `json:"orderer"`
	Status      db.MovieNoteStatus `json:"status"`
}
