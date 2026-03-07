package domain

import (
	"time"

	"github.com/google/uuid"
)

type Collection struct {
	ID        uuid.UUID
	CreatedAt time.Time
	CreatedBy uuid.UUID
	UpdatedAt time.Time
	UpdatedBy uuid.UUID
	Name      string
	UserID    uuid.UUID
	// relations
	Creator IUser
	Updater IUser
	User    IUser
	Items   []*CollectionItem
}

type CollectionItem struct {
	ID           uuid.UUID
	CollectionID uuid.UUID
	NoteID       uuid.UUID
	ContentID    uuid.UUID
	Category     ContentCategory
	CreatedAt    time.Time
	CreatedBy    uuid.UUID
	// relations
	Creator     IUser
	Collection  *Collection
	ContentNote IContentNote
	Content     IContent
}
