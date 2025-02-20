package responses

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentNoteSearchResultRes interface {
	GetID() uuid.UUID
	GetName() string
	GetCategory() db.ContentCategory
	GetStatus() string
	GetCreatedAt() time.Time
	GetInitialOrdererUsername() string
	GetOrdererCount() int64
	GetPosterURL() *string

	SetPosterURL(url string)
}

type basicNoteSearchResultRes struct {
	ID                     uuid.UUID         `json:"id"`
	CreatedAt              time.Time         `json:"createdAt"`
	Name                   string            `json:"name"`
	Status                 db.GameNoteStatus `json:"status"`
	Rate                   *int16            `json:"rate,omitempty"`
	Comment                *string           `json:"comment,omitempty"`
	InitialOrdererUsername string            `json:"initialOrdererUsername"`
	OrdererCount           int64             `json:"ordererCount"`
	PosterURL              *string           `json:"posterUrl,omitempty"`
}

func (b *basicNoteSearchResultRes) GetID() uuid.UUID {
	return b.ID
}

func (b *basicNoteSearchResultRes) GetName() string {
	return b.Name
}

func (b *basicNoteSearchResultRes) GetStatus() string {
	return string(b.Status)
}

func (b *basicNoteSearchResultRes) GetCreatedAt() time.Time {
	return b.CreatedAt
}

func (b *basicNoteSearchResultRes) GetInitialOrdererUsername() string {
	return b.InitialOrdererUsername
}

func (b *basicNoteSearchResultRes) GetOrdererCount() int64 {
	return b.OrdererCount
}

func (b *basicNoteSearchResultRes) GetPosterURL() *string {
	return b.PosterURL
}

func (b *basicNoteSearchResultRes) SetPosterURL(url string) {
	b.PosterURL = &url
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
