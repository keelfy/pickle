package responses

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type GameNoteRes struct {
	ID           uuid.UUID         `json:"id"`
	CreatedAt    time.Time         `json:"createdAt"`
	UserID       uuid.UUID         `json:"userId"`
	Rate         *int16            `json:"rate,omitempty"`
	Comment      *string           `json:"comment,omitempty"`
	Status       db.GameNoteStatus `json:"status"`
	LastPlayedAt *time.Time        `json:"lastPlayedAt,omitempty"`
	OrdererCount int64             `json:"ordererCount"`
	Content      *GameRes          `json:"content,omitempty"`
}

type MovieNoteRes struct {
	ID           uuid.UUID          `json:"id"`
	CreatedAt    time.Time          `json:"createdAt"`
	UserID       uuid.UUID          `json:"userId"`
	Rate         *int16             `json:"rate,omitempty"`
	Comment      *string            `json:"comment,omitempty"`
	Status       db.MovieNoteStatus `json:"status"`
	WatchedAt    *time.Time         `json:"watchedAt,omitempty"`
	OrdererCount int64              `json:"ordererCount"`
	Content      *MovieRes          `json:"content,omitempty"`
}
