package types

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/models"
)

type PaginatedRes[T any] struct {
	Content       []T   `json:"content"`
	Page          int   `json:"page"`
	Size          int   `json:"size"`
	TotalPages    int64 `json:"totalPages"`
	TotalElements int64 `json:"totalElements"`
}

type SearchHitRes[T any] struct {
	ID     string  `json:"id,omitempty"`
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

type ImageRes struct {
	URL string `json:"url"`
}

type ImagePreviewRes struct {
	PreviewID  uuid.UUID `json:"previewId"`
	PreviewURL string    `json:"previewUrl"`
}

type CountsRes struct {
	Played    int64 `json:"played,omitempty"`
	Watched   int64 `json:"watched,omitempty"`
	Ordered   int64 `json:"ordered,omitempty"`
	Followers int64 `json:"followers,omitempty"`
}

type TwitchConnectionRes struct {
	Connected bool   `json:"connected"`
	Login     string `json:"login,omitempty"`
}

type ConnectionsRes struct {
	Twitch TwitchConnectionRes `json:"twitch,omitempty"`
}

type ProfileRes struct {
	UserID       string          `json:"id"`
	CreatedAt    time.Time       `json:"createdAt"`
	DisplayName  string          `json:"displayName"`
	Username     string          `json:"username"`
	Description  *string         `json:"description,omitempty"`
	Counts       *CountsRes      `json:"counts,omitempty"`
	IsFollowing  bool            `json:"isFollowing"`
	IsAuthorized bool            `json:"isAuthorized"`
	AvatarURL    string          `json:"avatarUrl,omitempty"`
	Connections  *ConnectionsRes `json:"connections,omitempty"`
}

type ModeratorProfileRes struct {
	UserID      string    `json:"id"`
	AddedAt     time.Time `json:"addedAt"`
	DisplayName string    `json:"displayName"`
	Username    string    `json:"username"`
	AvatarURL   string    `json:"avatarUrl,omitempty"`
}

type ContentRes struct {
	ID       uuid.UUID          `json:"id"`
	Title    string             `json:"title"`
	UserID   uuid.UUID          `json:"userId,omitempty"`
	Category db.ContentCategory `json:"category"`
}

type BatchNoteReactionsRes struct {
	NoteID    string                  `json:"noteId"`
	Reactions []*models.ReactionStack `json:"reactions"`
}

type OrdererRes struct {
	ID        string  `json:"id"`
	UserID    *string `json:"userId,omitempty"`
	Username  string  `json:"name"`
	Anonymous bool    `json:"anonymous"`
}

type OrderRes struct {
	ID                 uuid.UUID          `json:"id"`
	CreatedAt          time.Time          `json:"createdAt"`
	UpdatedAt          time.Time          `json:"updatedAt"`
	UpdatedBy          *uuid.UUID         `json:"updatedBy"`
	PaymentType        int16              `json:"paymentType"`
	Amount             float32            `json:"amount"`
	OrdererID          uuid.UUID          `json:"ordererId,omitempty"`
	OrdererDisplayName *string            `json:"ordererDisplayName,omitempty"`
	Status             db.OrderStatus     `json:"status"`
	Category           db.ContentCategory `json:"category"`
	Message            string             `json:"message"`
	Source             string             `json:"source"`
	Reference          string             `json:"reference"`
	Anonymous          bool               `json:"anonymous"`
}

type OrderUpdateRes struct {
	OrderRes
	NoteCreated bool   `json:"noteCreated"`
	NoteID      string `json:"noteId,omitempty"`
}

type LinkValidationRes struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}

type StatusCountRes struct {
	Count int64 `json:"count"`
}

type PosterPreviewRes struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	URL       string    `json:"url"`
}

type CollectionRes struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Name      string    `json:"name"`
}

type CollectionItemRes struct {
	ID           uuid.UUID  `json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	CollectionID uuid.UUID  `json:"collectionId"`
	CoverURL     string     `json:"coverUrl,omitempty"`
	Content      ContentRes `json:"content"`
}

type BatchCollectionItemsRes struct {
	PaginatedRes[CollectionItemRes]
	CollectionID uuid.UUID `json:"collectionId"`
}
