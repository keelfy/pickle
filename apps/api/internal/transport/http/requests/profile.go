package requests

import (
	"github.com/google/uuid"
)

type UpdateUser struct {
	DisplayName           string                    `json:"displayName"`
	Username              string                    `json:"username"`
	Description           string                    `json:"description"`
	SocialLinks           []*UserSocialLink         `json:"socialLinks"`
	SuggestionPreferences UserSuggestionPreferences `json:"suggestionPreferences"`
}

type UserSuggestionPreferences struct {
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
