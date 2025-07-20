package responses

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNoteSearchResultRes interface {
	GetID() uuid.UUID
	GetTitle() string
	GetCategory() db.ContentCategory
	GetStatus() string
	GetCreatedAt() time.Time
	GetInitialOrdererUserID() uuid.UUID
	GetInitialOrdererDisplayName() string
	GetOrdererCount() int64
	GetCoverURL() *string

	SetCoverURL(url string)
}

type basicNoteSearchResultRes struct {
	ID                        uuid.UUID         `json:"id"`
	CreatedAt                 time.Time         `json:"createdAt"`
	Title                     string            `json:"title"`
	Status                    db.GameNoteStatus `json:"status"`
	Rate                      *int16            `json:"rate,omitempty"`
	Comment                   *string           `json:"comment,omitempty"`
	InitialOrdererUserID      uuid.UUID         `json:"initialOrdererUserId"`
	InitialOrdererDisplayName string            `json:"initialOrdererDisplayName"`
	OrdererCount              int64             `json:"ordererCount"`
	CoverURL                  *string           `json:"coverUrl,omitempty"`
}

func (b *basicNoteSearchResultRes) GetID() uuid.UUID {
	return b.ID
}

func (b *basicNoteSearchResultRes) GetTitle() string {
	return b.Title
}

func (b *basicNoteSearchResultRes) GetStatus() string {
	return string(b.Status)
}

func (b *basicNoteSearchResultRes) GetCreatedAt() time.Time {
	return b.CreatedAt
}

func (b *basicNoteSearchResultRes) GetInitialOrdererUserID() uuid.UUID {
	return b.InitialOrdererUserID
}

func (b *basicNoteSearchResultRes) GetInitialOrdererDisplayName() string {
	return b.InitialOrdererDisplayName
}

func (b *basicNoteSearchResultRes) GetOrdererCount() int64 {
	return b.OrdererCount
}

func (b *basicNoteSearchResultRes) GetCoverURL() *string {
	return b.CoverURL
}

func (b *basicNoteSearchResultRes) SetCoverURL(url string) {
	b.CoverURL = &url
}

type GameNoteSearchResultRes struct {
	basicNoteSearchResultRes
	ReleaseDate  *time.Time `json:"releaseDate,omitempty"`
	LastPlayedAt *time.Time `json:"lastPlayedAt,omitempty"`
}

func (g *GameNoteSearchResultRes) GetCategory() db.ContentCategory {
	return db.ContentCategoryGames
}

type MovieNoteSearchResultRes struct {
	basicNoteSearchResultRes
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
	WatchedAt   *time.Time `json:"watchedAt,omitempty"`
}

func (m *MovieNoteSearchResultRes) GetCategory() db.ContentCategory {
	return db.ContentCategoryMovies
}
