package binders

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/utils"
)

func BindFollowUserCommand(r *http.Request) (*commands.FollowUserCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	followerUserID, err := utils.GetUserIDFromCtx(r.Context())
	if err != nil {
		return nil, err
	}

	return &commands.FollowUserCommand{
		UserID:         userID,
		FollowerUserID: followerUserID,
	}, nil
}
