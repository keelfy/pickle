package binders

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/transport/http/requests"
	"github.com/pickle.pw/monolith/internal/utils"
)

func BindGetUserByIDCommand(r *http.Request) (*commands.GetUserByIDCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	avatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeMedium))
	return &commands.GetUserByIDCommand{
		ID:         userID,
		AvatarSize: domain.AvatarSize(avatarSize),
	}, nil
}

func BindGetMeCommand(r *http.Request) (*commands.GetUserByIDCommand, error) {
	userID, err := utils.GetUserIDFromCtx(r.Context())
	if err != nil {
		return nil, err
	}

	avatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeMedium))
	return &commands.GetUserByIDCommand{
		ID:         userID,
		AvatarSize: domain.AvatarSize(avatarSize),
	}, nil
}

func BindUpdateUserCommand(r *http.Request) (*commands.UpdateUserCommand, error) {
	userID, err := utils.GetUserIDFromCtx(r.Context())
	if err != nil {
		return nil, err
	}

	req := &requests.UpdateUser{}
	err = json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		return nil, err
	}

	links := make([]*commands.UserSocialLink, len(req.SocialLinks))
	for i, link := range req.SocialLinks {
		links[i] = &commands.UserSocialLink{
			ID:       link.ID,
			Name:     link.Name,
			URL:      link.URL,
			Position: link.Position,
		}
	}

	prefCategories := make([]domain.ContentCategory, len(req.SuggestionPreferences.Categories))
	for i, category := range req.SuggestionPreferences.Categories {
		prefCategories[i] = domain.ContentCategory(category)
	}

	prefs := &commands.SuggestionPreferences{
		Enabled:            req.SuggestionPreferences.Enabled,
		AllowedFree:        req.SuggestionPreferences.AllowedFree,
		AllowedAnonymously: req.SuggestionPreferences.AllowedAnonymously,
		Categories:         prefCategories,
	}

	return &commands.UpdateUserCommand{
		ID:                    userID,
		DisplayName:           req.DisplayName,
		Username:              req.Username,
		Description:           req.Description,
		SocialLinks:           links,
		SuggestionPreferences: prefs,
	}, nil
}
