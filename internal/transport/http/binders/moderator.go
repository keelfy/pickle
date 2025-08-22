package binders

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/transport/http/requests"
)

func BindAddModeratorCommand(r *http.Request) (*commands.AddModeratorCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	req := &requests.AddModerator{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, err
	}

	avatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeSmall))
	return &commands.AddModeratorCommand{
		UserID:     userID,
		Username:   req.Username,
		AvatarSize: domain.AvatarSize(avatarSize),
	}, nil
}

func BindDeleteModeratorCommand(r *http.Request) (*commands.DeleteModeratorCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	moderatorID, err := BindPathVariableAsUUID(r, "moderatorId")
	if err != nil {
		return nil, err
	}

	return &commands.DeleteModeratorCommand{
		UserID:          userID,
		ModeratorUserID: moderatorID,
	}, nil
}
