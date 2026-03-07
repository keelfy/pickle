package domain

import (
	"time"

	"github.com/google/uuid"
)

type Moderator struct {
	ID          uuid.UUID
	CreatedAt   time.Time
	CreatedBy   uuid.UUID
	DeletedAt   *time.Time
	DeletedBy   *uuid.UUID
	UserID      uuid.UUID
	ModeratorID uuid.UUID
}

// ModeratorUser is a moderator joined with their user data.
type ModeratorUser struct {
	*Moderator
	*User
}
