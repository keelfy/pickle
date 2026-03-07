package handler

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/service"
)

type WebhookHandler interface {
	HandleWebhook(w http.ResponseWriter, r *http.Request)
}

type webhookHandler struct {
	twitchAuthService service.TwitchAuthService
	oryAPI            clients.OryAPI
	eventsubService   service.EventsubService
}

func NewWebhookHandler(twitchAuthService service.TwitchAuthService, oryAPI clients.OryAPI, eventsubService service.EventsubService) WebhookHandler {
	return &webhookHandler{
		twitchAuthService: twitchAuthService,
		oryAPI:            oryAPI,
		eventsubService:   eventsubService,
	}
}

type WebhookBody struct {
	IdentityID string `json:"identityId"`
}

func (h *webhookHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var body WebhookBody

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	identityUUID, err := uuid.Parse(body.IdentityID)
	if err != nil {
		logger.Errorf(ctx, "Failed to parse identity ID: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	twitchAuth, err := h.oryAPI.GetIdentityTwitchOIDC(ctx, identityUUID)
	if err != nil {
		logger.Errorf(ctx, "Failed to get twitch auth: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if twitchAuth == nil {
		// unsubscribes all subscriptions for this identity
		h.eventsubService.UnsubscribeFromChannelPoints(ctx, identityUUID)
		w.WriteHeader(http.StatusOK)
		return
	}

	// TODO: handle broadcaster ID change?
	// unsubscribe old one and subcribe a new one, delete all the tracked rewards for the previous one

	logger.Debugf(ctx, "Twitch auth: %v", twitchAuth)

	auth, err := h.twitchAuthService.CreateTwitchAuthorization(ctx, identityUUID, twitchAuth)
	if err != nil {
		logger.Errorf(ctx, "Failed to create twitch auth: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = h.eventsubService.RequestSubscriptionForChannelPoints(ctx, auth)
	if err != nil {
		logger.Errorf(ctx, "Failed to request subscription for channel points: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
