package handlers

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type FollowerHandler interface {
	FollowUser(w http.ResponseWriter, r *http.Request)
	UnfollowUser(w http.ResponseWriter, r *http.Request)
}

type followerHandler struct {
	followerService services.FollowerService
	logger          *zap.SugaredLogger
}

func NewFollowerHandler(followerService services.FollowerService, zapLogger *zap.SugaredLogger) FollowerHandler {
	return &followerHandler{followerService: followerService, logger:

	// @Summary Follow profile
	// @Description Follow profile
	// @Tags profiles
	// @Accept json
	// @Produce json
	// @Param userId path string true "User ID"
	// @Success 204
	// @Failure 400 {object} string
	// @Failure 500 {object} string
	// @Router /v1/users/{userId}/follows [post]
	zapLogger}
}

func (h *followerHandler) FollowUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindFollowUserCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	isFollowing, err := h.followerService.IsFollowing(ctx, cmd.UserID, cmd.FollowerUserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if isFollowing {
		utils.HttpBusinessError(ctx, w, "User is already following target user", http.StatusBadRequest)
		return
	}

	err = h.followerService.Follow(ctx, cmd.UserID, cmd.FollowerUserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Unfollow profile
// @Description Unfollow profile
// @Tags profiles
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/follows [delete]
func (h *followerHandler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	followerUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	userID, err := binders.BindPathVariableAsUUID(r, binders.UserIDVariable)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	isFollowing, err := h.followerService.IsFollowing(ctx, userID, followerUserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !isFollowing {
		utils.HttpBusinessError(ctx, w, "User is not following target user", http.StatusBadRequest)
		return
	}

	if userID == followerUserID {
		utils.HttpBusinessError(ctx, w, "User cannot unfollow themselves", http.StatusBadRequest)
		return
	}

	err = h.followerService.Unfollow(ctx, userID, followerUserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
