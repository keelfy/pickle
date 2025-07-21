package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentWebsite struct {
	Trusted bool   `json:"trusted"`
	URL     string `json:"url"`
	Type    string `json:"type"`
}

type Content interface {
	GetID() uuid.UUID
	GetExternalID() int64
	GetTitle() string
	GetWebsites() *[]ContentWebsite
	GetCoverKey() *string
	GetCoverKeyType() db.NullImageKeyType
	GetSourceURL() *string
	GetSourceType() db.ContentSource
	GetCategory() db.ContentCategory
}

type Game struct {
	ID           uuid.UUID           `json:"id"`
	ExternalID   int64               `json:"externalId,omitempty"`
	Title        string              `json:"title,omitempty"`
	ReleaseDate  *time.Time          `json:"releaseDate,omitempty"`
	Websites     *[]ContentWebsite   `json:"websites,omitempty"`
	CoverKey     *string             `json:"coverKey,omitempty"`
	CoverKeyType db.NullImageKeyType `json:"coverKeyType,omitempty"`
	SourceURL    *string             `json:"sourceUrl,omitempty"`
	SourceType   db.ContentSource    `json:"sourceType,omitempty"`
}

func (g *Game) GetID() uuid.UUID {
	return g.ID
}

func (g *Game) GetExternalID() int64 {
	return g.ExternalID
}

func (g *Game) GetTitle() string {
	return g.Title
}

func (g *Game) GetWebsites() *[]ContentWebsite {
	return g.Websites
}

func (g *Game) GetCoverKey() *string {
	return g.CoverKey
}

func (g *Game) GetCoverKeyType() db.NullImageKeyType {
	return g.CoverKeyType
}

func (g *Game) GetSourceURL() *string {
	return g.SourceURL
}

func (g *Game) GetSourceType() db.ContentSource {
	return g.SourceType
}

func (g *Game) GetCategory() db.ContentCategory {
	return db.ContentCategoryGames
}

type Movie struct {
	ID           uuid.UUID           `json:"id"`
	ExternalID   int64               `json:"externalId,omitempty"`
	Title        string              `json:"title,omitempty"`
	ReleaseDate  *time.Time          `json:"releaseDate,omitempty"`
	Websites     *[]ContentWebsite   `json:"websites"`
	CoverKey     *string             `json:"coverKey,omitempty"`
	CoverKeyType db.NullImageKeyType `json:"coverKeyType,omitempty"`
	SourceURL    *string             `json:"sourceUrl,omitempty"`
	SourceType   db.ContentSource    `json:"sourceType,omitempty"`
}

func (m *Movie) GetID() uuid.UUID {
	return m.ID
}

func (m *Movie) GetExternalID() int64 {
	return m.ExternalID
}

func (m *Movie) GetTitle() string {
	return m.Title
}

func (m *Movie) GetWebsites() *[]ContentWebsite {
	return m.Websites
}

func (m *Movie) GetCoverKey() *string {
	return m.CoverKey
}

func (m *Movie) GetCoverKeyType() db.NullImageKeyType {
	return m.CoverKeyType
}

func (m *Movie) GetSourceURL() *string {
	return m.SourceURL
}

func (m *Movie) GetSourceType() db.ContentSource {
	return m.SourceType
}

func (m *Movie) GetCategory() db.ContentCategory {
	return db.ContentCategoryMovies
}
