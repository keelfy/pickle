package presenter

import (
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentUserContext(userCtx *domain.UserContext) *resp.UserContext {
	if userCtx == nil {
		return &resp.UserContext{
			IsFollowing:  false,
			IsAuthorized: false,
			IsModerator:  false,
		}
	}

	return &resp.UserContext{
		IsFollowing:  userCtx.IsFollowing,
		IsAuthorized: userCtx.IsAuthorized,
		IsModerator:  userCtx.IsModerator,
	}
}

func PresentSuggestionPreferences(preferences *domain.SuggestionPreferences) *resp.SuggestionPreferences {
	var prefs *resp.SuggestionPreferences
	categories := make([]string, 0, len(preferences.Categories))
	for _, c := range preferences.Categories {
		categories = append(categories, string(c))
	}
	prefs = &resp.SuggestionPreferences{
		Enabled:            preferences.Enabled,
		AllowedFree:        preferences.AllowedFree,
		AllowedAnonymously: preferences.AllowedAnonymously,
		Categories:         categories,
	}
	return prefs
}

func PresentLinks(links []*domain.ProfileLink) []*resp.UserSocialLink {
	linksResp := make([]*resp.UserSocialLink, 0, len(links))
	for _, link := range links {
		linksResp = append(linksResp, &resp.UserSocialLink{
			ID:       link.ID,
			Name:     link.Name,
			URL:      link.URL,
			Position: link.Position,
		})
	}
	return linksResp
}

func PresentUser(user domain.IUser, avatarURL string) *resp.User {
	return &resp.User{
		ID:          user.GetID(),
		DisplayName: user.GetDisplayName(),
		AvatarURL:   avatarURL,
		Username:    user.GetUsername(),
	}
}

func PresentDetailedUser(user *domain.DetailedUser, userCtx *domain.UserContext, avatarURL string) *resp.DetailedUser {
	userResp := PresentUser(user.User, avatarURL)
	userCtxResp := PresentUserContext(userCtx)
	prefs := PresentSuggestionPreferences(user.SuggestionPreferences)
	links := PresentLinks(user.Links)
	return &resp.DetailedUser{
		User:                  *userResp,
		Description:           user.Description,
		SuggestionPreferences: prefs,
		SocialLinks:           links,
		Context:               userCtxResp,
	}
}
