package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ModeratorHandler interface {
	AddModerator(w http.ResponseWriter, r *http.Request)
	DeleteModerator(w http.ResponseWriter, r *http.Request)
	GetModerators(w http.ResponseWriter, r *http.Request)
}

type moderatorHandler struct {
	moderatorService services.ModeratorService
	profileService   services.ProfileService
}

func NewModeratorHandler(moderatorService services.ModeratorService, profileService services.ProfileService) ModeratorHandler {
	return &moderatorHandler{moderatorService: moderatorService, profileService: profileService}
}

func (h *moderatorHandler) AddModerator(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	avatarSize := utils.GetQueryParam(r, "avatarSize", "sm")

	req := &types.AddModeratorReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	moderatorProfile, err := h.moderatorService.AddModeratorByUserLink(ctx, userId, req.UserLink, avatarSize)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, moderatorProfile)
}

func (h *moderatorHandler) DeleteModerator(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	moderatorID, err := utils.ReadPathUUIDVariable("moderatorId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = h.moderatorService.DeleteModerator(ctx, userID, moderatorID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *moderatorHandler) GetModerators(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	avatarSize := utils.GetQueryParam(r, "avatarSize", "sm")

	moderators, err := h.moderatorService.GetModeratorsByUserID(ctx, userID, avatarSize)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, moderators)
}
