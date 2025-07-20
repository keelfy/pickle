package responses

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentWebsiteRes struct {
	URL  string `json:"url"`
	Type string `json:"type"`
}

type GameRes struct {
	ID          uuid.UUID           `json:"id"`
	ExternalID  int64               `json:"externalId,omitempty"`
	Title       string              `json:"title,omitempty"`
	ReleaseDate *time.Time          `json:"releaseDate,omitempty"`
	Websites    []ContentWebsiteRes `json:"websites,omitempty"`
	CoverURL    *string             `json:"coverUrl,omitempty"`
	SourceURL   *string             `json:"sourceUrl,omitempty"`
	SourceType  db.ContentSource    `json:"sourceType,omitempty"`
}

type MovieRes struct {
	ID          uuid.UUID           `json:"id"`
	ExternalID  int64               `json:"externalId,omitempty"`
	Title       string              `json:"title,omitempty"`
	ReleaseDate *time.Time          `json:"releaseDate,omitempty"`
	Websites    []ContentWebsiteRes `json:"websites,omitempty"`
	CoverURL    *string             `json:"coverUrl,omitempty"`
	SourceURL   *string             `json:"sourceUrl,omitempty"`
	SourceType  db.ContentSource    `json:"sourceType,omitempty"`
}
