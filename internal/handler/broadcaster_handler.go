package handler

import (
	"encoding/json"
	"net/http"

	"github.com/pickle-pw/twitch-harbor/internal/middleware"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/service"
	"github.com/pickle-pw/twitch-harbor/internal/util"
)

type BroadcasterHandler interface {
	GetBroadcasterPreferences(w http.ResponseWriter, r *http.Request)
	SaveBroadcasterPreferences(w http.ResponseWriter, r *http.Request)
}

type broadcasterHandler struct {
	broadcasterService service.BroadcasterService
}

func NewBroadcasterHandler(broadcasterService service.BroadcasterService) BroadcasterHandler {
	return &broadcasterHandler{
		broadcasterService: broadcasterService,
	}
}

func (h *broadcasterHandler) GetBroadcasterPreferences(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	session, err := middleware.GetSession(ctx)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewForbiddenError("Failed to get session", err), w)
		return
	}

	preferences, err := h.broadcasterService.GetBroadcasterPreferences(ctx, session)
	if err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	util.WriteHttpJsonResponse(ctx, w, preferences)
}

func (h *broadcasterHandler) SaveBroadcasterPreferences(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req model.BroadcasterPreferencesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	if err := req.Validate(); err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	session, err := middleware.GetSession(ctx)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewForbiddenError("Failed to get session", err), w)
		return
	}

	err = h.broadcasterService.SaveBroadcasterPreferences(ctx, session, &req)
	if err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
}
