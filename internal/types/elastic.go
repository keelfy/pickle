package types

import (
	"time"

	"github.com/google/uuid"
)

type EsContent struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	UserID   uuid.UUID `json:"user_id"`
	Category int16     `json:"category"`
}

type EsGameNote struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	UserID      uuid.UUID `json:"user_id"`
	RequestDate time.Time `json:"request_date"`
	OrdererName string    `json:"orderer"`
	Status      int16     `json:"status"`
}
