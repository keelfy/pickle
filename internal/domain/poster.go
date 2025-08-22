package domain

import (
	"time"

	"github.com/google/uuid"
)

type PosterPreview struct {
	ID        uuid.UUID
	CreatedAt time.Time
	CreatedBy uuid.UUID
	ObjectKey string
}
