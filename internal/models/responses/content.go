package responses

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/models"
)

type ContentRes interface {
	GetID() uuid.UUID
	GetExternalID() int64
	GetTitle() string
	GetCoverURL() *string
	GetSourceURL() *string
	GetSourceType() db.ContentSource
}

type BasicContentRes struct {
	ID         uuid.UUID        `json:"id"`
	ExternalID int64            `json:"externalId,omitempty"`
	Title      string           `json:"title"`
	CoverURL   *string          `json:"coverUrl,omitempty"`
	SourceURL  *string          `json:"sourceUrl,omitempty"`
	SourceType db.ContentSource `json:"sourceType"`
}

func (c *BasicContentRes) GetID() uuid.UUID {
	return c.ID
}

func (c *BasicContentRes) GetExternalID() int64 {
	return c.ExternalID
}

func (c *BasicContentRes) GetTitle() string {
	return c.Title
}

func (c *BasicContentRes) GetCoverURL() *string {
	return c.CoverURL
}

func (c *BasicContentRes) GetSourceURL() *string {
	return c.SourceURL
}

func (c *BasicContentRes) GetSourceType() db.ContentSource {
	return c.SourceType
}

type GameRes struct {
	BasicContentRes
	ReleaseDate *time.Time               `json:"releaseDate,omitempty"`
	Websites    *[]models.ContentWebsite `json:"websites,omitempty"`
}

type MovieRes struct {
	BasicContentRes
	ReleaseDate *time.Time               `json:"releaseDate,omitempty"`
	Websites    *[]models.ContentWebsite `json:"websites,omitempty"`
}
