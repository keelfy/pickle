package types

import (
	"time"

	"github.com/google/uuid"
)

type InsertGameNote struct {
	UserId           string    `json:"user_id"`
	Name             string    `json:"name"`
	Link             string    `json:"link"`
	ReleaseDate      time.Time `json:"release_date"`
	Rate             int       `json:"rate"`
	Comment          string    `json:"comment"`
	Ordered          bool      `json:"ordered"`
	Status           int       `json:"status"`
	CompletionStatus int       `json:"completion_status"`
	CompletionDate   time.Time `json:"completion_date"`

	CreatedAt time.Time `json:"created_at"`
	CreatedBy string    `json:"created_by"`
	UpdatedAt time.Time `json:"updated_at"`
	UpdatedBy string    `json:"updated_by"`
}

type InsertOrder struct {
	ReceiverId      *uuid.UUID `json:"receiver_id"`   // User ID
	SerialNumber    int        `json:"serial_number"` // Number of a order for a user
	PaymentType     int        `json:"payment_type"`
	Amount          float32    `json:"amount"`
	OrderedBy       *uuid.UUID `json:"ordered_by"` // User ID
	OrdererUsername string     `json:"orderer_username"`
	CategoryType    int        `json:"category_type"` // Category
	Message         string     `json:"message"`
	Status          int        `json:"status"`
	CreatedBy       *uuid.UUID `json:"created_by"` // User ID
	UpdatedAt       time.Time  `json:"updated_at"`
	UpdatedBy       *uuid.UUID `json:"updated_by"` // User ID
}
