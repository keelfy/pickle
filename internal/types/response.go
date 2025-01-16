package types

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type PaginatedRes[T any] struct {
	Content       []T   `json:"content"`
	Page          int   `json:"page"`
	Size          int   `json:"size"`
	TotalPages    int64 `json:"totalPages"`
	TotalElements int64 `json:"totalElements"`
}

type SearchHitRes[T any] struct {
	Source T       `json:"source"`
	Score  float64 `json:"score"`
}

type StatusRes struct {
	API            string `json:"api"`
	Database       string `json:"database"`
	Storage        string `json:"storage"`
	Search         string `json:"search"`
	Cache          string `json:"cache"`
	Authentication string `json:"authentication"`
}

type ProfileRes struct {
	UserID      string    `json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	Username    string    `json:"username"`
	Link        string    `json:"link"`
	Description *string   `json:"description,omitempty"`
}

type ContentRes struct {
	ID       uuid.UUID          `json:"id"`
	Name     string             `json:"name"`
	UserID   uuid.UUID          `json:"userId"`
	Category db.ContentCategory `json:"category"`
}

type ContentSearchRes = PaginatedRes[SearchHitRes[ContentRes]]

type GameNoteRes struct {
	ID           string            `json:"id"`
	CreatedAt    time.Time         `json:"createdAt"`
	UserID       string            `json:"userId"`
	Name         string            `json:"name"`
	Link         *string           `json:"link,omitempty"`
	ReleaseDate  *time.Time        `json:"releaseDate,omitempty"`
	Rate         *int16            `json:"rate,omitempty"`
	Comment      *string           `json:"comment,omitempty"`
	Ordered      bool              `json:"ordered"`
	Status       db.GameNoteStatus `json:"status"`
	LastPlayedAt *time.Time        `json:"lastPlayedAt,omitempty"`
}

type OrdererRes struct {
	ID        uuid.UUID  `json:"id"`
	UserID    *uuid.UUID `json:"userId,omitempty"`
	Username  string     `json:"name"`
	Anonymous bool       `json:"anonymous"`
}

type OrderRes struct {
	ID              string             `json:"id"`
	CreatedAt       time.Time          `json:"createdAt"`
	UpdatedAt       time.Time          `json:"updatedAt"`
	UpdatedBy       string             `json:"updatedBy"`  // User ID
	ReceiverID      string             `json:"receiverId"` // User ID
	PaymentType     int16              `json:"paymentType"`
	Amount          float32            `json:"amount"`
	Orderer         uuid.UUID          `json:"orderer,omitempty"`
	OrdererUsername string             `json:"ordererUsername"`
	Status          db.OrderStatus     `json:"status"`
	Category        db.ContentCategory `json:"category"` // Category
	Message         string             `json:"message"`
	UpdatedCategory db.ContentCategory `json:"updatedCategory"`
	UpdatedMessage  string             `json:"updatedMessage"`
}

type LinkValidationRes struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}
