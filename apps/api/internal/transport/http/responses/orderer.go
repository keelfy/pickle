package responses

import "github.com/google/uuid"

type Orderer struct {
	ID          uuid.UUID  `json:"id"`
	UserID      *uuid.UUID `json:"userId,omitempty"`
	DisplayName string     `json:"displayName"`
	Source      string     `json:"source"`
	AvatarURL   *string    `json:"avatarUrl"`
	URL         *string    `json:"url"`
}
