package mapper

import (
	"encoding/json"

	"github.com/pickle.pw/monolith/internal/domain"
)

func MapDBSuggestionPreferencesToDomain(suggestionPreferences json.RawMessage) *domain.SuggestionPreferences {
	sp := &domain.SuggestionPreferences{}
	err := json.Unmarshal(suggestionPreferences, &sp)
	if err != nil {
		return nil
	}
	return sp
}

func MapDBLinksToDomain(links json.RawMessage) []*domain.ProfileLink {
	linksDomain := []*domain.ProfileLink{}
	err := json.Unmarshal(links, &linksDomain)
	if err != nil {
		return nil
	}
	return linksDomain
}
