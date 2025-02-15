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

type ProfileRes struct {
	UserID       string     `json:"id"`
	CreatedAt    time.Time  `json:"createdAt"`
	Username     string     `json:"username"`
	Link         string     `json:"link"`
	Description  *string    `json:"description,omitempty"`
	Counts       *CountsRes `json:"counts,omitempty"`
	IsFollowing  bool       `json:"isFollowing"`
	IsAuthorized bool       `json:"isAuthorized"`
	AvatarURL    string     `json:"avatarUrl,omitempty"`
}

type ModeratorProfileRes struct {
	UserID    string    `json:"id"`
	AddedAt   time.Time `json:"addedAt"`
	Username  string    `json:"username"`
	Link      string    `json:"link"`
	AvatarURL string    `json:"avatarUrl,omitempty"`
}

type ContentRes struct {
	ID       uuid.UUID          `json:"id"`
	Name     string             `json:"name"`
	UserID   uuid.UUID          `json:"userId,omitempty"`
	Category db.ContentCategory `json:"category"`
}

type ContentSearchRes = PaginatedRes[SearchHitRes[ContentRes]]

type GameNoteRes struct {
	ID                     string            `json:"id"`
	CreatedAt              time.Time         `json:"createdAt"`
	UserID                 string            `json:"userId"`
	Name                   string            `json:"name"`
	Link                   *string           `json:"link,omitempty"`
	ReleaseDate            *time.Time        `json:"releaseDate,omitempty"`
	Rate                   *int16            `json:"rate,omitempty"`
	Comment                *string           `json:"comment,omitempty"`
	Ordered                bool              `json:"ordered"`
	Status                 db.GameNoteStatus `json:"status"`
	LastPlayedAt           *time.Time        `json:"lastPlayedAt,omitempty"`
	PosterURL              *string           `json:"posterUrl,omitempty"`
	InitialOrdererUsername *string           `json:"initialOrdererUsername,omitempty"`
	OrdererCount           int64             `json:"ordererCount"`
}

type GameNoteSearchRes = PaginatedRes[SearchHitRes[GameNoteRes]]

type NoteReactionRes struct {
	EmoteID       string `json:"emoteId"`
	Source        string `json:"source"`
	Count         int64  `json:"count"`
	ReactedByUser bool   `json:"reactedByUser"`
}

type BatchNoteReactionsRes struct {
	NoteID    uuid.UUID         `json:"noteId"`
	Reactions []NoteReactionRes `json:"reactions"`
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
	OrdererUsername string             `json:"ordererUsername,omitempty"`
	Status          db.OrderStatus     `json:"status"`
	Category        db.ContentCategory `json:"category"` // Category
	Message         string             `json:"message"`
	UpdatedCategory db.ContentCategory `json:"updatedCategory"`
	UpdatedMessage  string             `json:"updatedMessage"`
}

type OrderUpdateRes struct {
	OrderRes
	ContentCreated bool      `json:"contentCreated"`
	ContentID      uuid.UUID `json:"contentId,omitempty"`
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
	PosterURL    string     `json:"posterUrl,omitempty"`
	Content      ContentRes `json:"content"`
}

type BatchCollectionItemsRes struct {
	PaginatedRes[CollectionItemRes]
	CollectionID uuid.UUID `json:"collectionId"`
}
