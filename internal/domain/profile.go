package domain

import (
	"github.com/google/uuid"
)

// Domain-level profile-related types. No json tags here; these types should not
// be coupled to transport concerns. Services should work with these types.

type ProfileCounts struct {
	Played    int64
	Watched   int64
	Ordered   int64
	Followers int64
}

type SuggestionPreferences struct {
	Enabled            bool
	AllowedFree        bool
	AllowedAnonymously bool
	Categories         []ContentCategory
}

type ProfileLink struct {
	ID       uuid.UUID
	Name     string
	URL      string
	Position int
}
