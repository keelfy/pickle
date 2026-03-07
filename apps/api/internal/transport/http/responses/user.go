package responses

import (
	"github.com/google/uuid"
)

type UserContext struct {
	IsFollowing  bool `json:"isFollowing"`
	IsAuthorized bool `json:"isAuthorized"`
	IsModerator  bool `json:"isModerator"`
}

type SuggestionPreferences struct {
	Enabled            bool     `json:"enabled"`
	AllowedFree        bool     `json:"allowedFree"`
	AllowedAnonymously bool     `json:"allowedAnonymously"`
	Categories         []string `json:"categories"`
}

type UserSocialLink struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	URL      string    `json:"url"`
	Position int       `json:"position"`
}

type User struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"displayName"`
	AvatarURL   string    `json:"avatarUrl"`
	Username    string    `json:"username"`
}

type DetailedUser struct {
	User
	Description           string                 `json:"description"`
	SuggestionPreferences *SuggestionPreferences `json:"suggestionPreferences,omitempty"`
	SocialLinks           []*UserSocialLink      `json:"socialLinks"`
	Context               *UserContext           `json:"context"`
}

type UsernameValidation struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}
