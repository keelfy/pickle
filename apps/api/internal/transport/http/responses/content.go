package responses

import (
	"time"

	"github.com/google/uuid"
)

type Cover struct {
	URL string `json:"url"`
}

type CoverPreview struct {
	PreviewID uuid.UUID `json:"previewId"`
	CreatedAt time.Time `json:"createdAt"`
	URL       string    `json:"url"`
}

type ContentWebsite struct {
	Trusted bool   `json:"trusted"`
	URL     string `json:"url"`
	Type    string `json:"type"`
}

type IContent interface {
	GetID() uuid.UUID
	GetTitle() string
	GetCoverURL() *string
	GetCategory() string
}

type Content struct {
	ID       uuid.UUID `json:"id"`
	Title    string    `json:"title"`
	CoverURL *string   `json:"coverUrl,omitempty"`
	Category string    `json:"category"`
}

type UserContent struct {
	*Content
	NoteID *uuid.UUID `json:"noteId,omitempty"`
}

func (c *Content) GetID() uuid.UUID {
	return c.ID
}

func (c *Content) GetTitle() string {
	return c.Title
}

func (c *Content) GetCoverURL() *string {
	return c.CoverURL
}

func (c *Content) GetCategory() string {
	return c.Category
}

type IDetailedContent interface {
	IContent
	GetSourceURL() *string
	GetSourceType() *string
	GetWebsites() []*ContentWebsite
}

type DetailedContent struct {
	*Content
	SourceURL  *string           `json:"sourceUrl,omitempty"`
	SourceType *string           `json:"sourceType,omitempty"`
	Websites   []*ContentWebsite `json:"websites,omitempty"`
}

func (d *DetailedContent) GetSourceURL() *string {
	return d.SourceURL
}

func (d *DetailedContent) GetSourceType() *string {
	return d.SourceType
}

func (d *DetailedContent) GetWebsites() []*ContentWebsite {
	return d.Websites
}

type Game struct {
	*Content
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
}

type DetailedGame struct {
	*DetailedContent
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
}

type Movie struct {
	*Content
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
}

type DetailedMovie struct {
	*DetailedContent
	ReleaseDate *time.Time `json:"releaseDate,omitempty"`
}
