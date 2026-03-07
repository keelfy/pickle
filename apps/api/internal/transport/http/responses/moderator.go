package responses

import (
	"time"

	"github.com/google/uuid"
)

type Moderator struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"userId"`
	ModeratorUserID uuid.UUID `json:"moderatorUserId"`
	AddedAt         time.Time `json:"addedAt"`
	Username        string    `json:"username"`
	DisplayName     string    `json:"displayName"`
	AvatarURL       string    `json:"avatarUrl"`
}
