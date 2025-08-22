package domain

import (
	"time"

	"github.com/google/uuid"
)

type IContentNote interface {
	GetID() uuid.UUID
	GetUserID() uuid.UUID
	GetCategory() ContentCategory
	// relations
	GetContent() IContent
}

type IDetailedContentNote interface {
	IContentNote
	GetStatus() string
	GetCreatedAt() time.Time
	GetUpdatedAt() time.Time
	GetRate() *int16
	GetComment() string
	GetInitialOrdererID() uuid.UUID
	GetOrdererCount() int64
	// relations
	GetInitialOrderer() *Orderer
}

type ContentNote struct {
	ID       uuid.UUID
	UserID   uuid.UUID
	Category ContentCategory
	// relations
	Content IContent
}

func (c *ContentNote) GetID() uuid.UUID {
	return c.ID
}

func (c *ContentNote) GetUserID() uuid.UUID {
	return c.UserID
}

func (c *ContentNote) GetCategory() ContentCategory {
	return c.Category
}

func (c *ContentNote) GetContent() IContent {
	return c.Content
}

type DetailedContentNote struct {
	*ContentNote
	InitialOrdererID uuid.UUID
	Rate             *int16
	Comment          string
	CreatedAt        time.Time
	UpdatedAt        time.Time
	OrdererCount     int64
	// relations
	InitialOrderer *Orderer
}

func (d *DetailedContentNote) GetCreatedAt() time.Time {
	return d.CreatedAt
}

func (d *DetailedContentNote) GetUpdatedAt() time.Time {
	return d.UpdatedAt
}

func (d *DetailedContentNote) GetRate() *int16 {
	return d.Rate
}

func (d *DetailedContentNote) GetComment() string {
	return d.Comment
}

func (d *DetailedContentNote) GetInitialOrdererID() uuid.UUID {
	return d.InitialOrdererID
}

func (d *DetailedContentNote) GetOrdererCount() int64 {
	return d.OrdererCount
}

func (d *DetailedContentNote) GetInitialOrderer() *Orderer {
	return d.InitialOrderer
}
