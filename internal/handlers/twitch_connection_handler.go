package handlers

import (
	"errors"
	"net/http"
	"time"

	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/utils"
)

type TwitchConnectionHandler interface {
	ConnectTwitchRedemptions(w http.ResponseWriter, r *http.Request)
	TwitchRedemptionsCallback(w http.ResponseWriter, r *http.Request)
}

type twitchConnectionHandler struct {
	twitchService  services.TwitchService
	profileService services.ProfileService
}

func NewTwitchConnectionHandler(twitchService services.TwitchService, profileService services.ProfileService) TwitchConnectionHandler {
	return &twitchConnectionHandler{
		twitchService:  twitchService,
		profileService: profileService,
	}
}

func (h *twitchConnectionHandler) ConnectTwitchRedemptions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	state := h.twitchService.GenerateAuthState(ctx, userID.String())
	http.SetCookie(w, &http.Cookie{
		Name:     "twitch_oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   3600,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})

	authURL, err := h.twitchService.GetTwitchAuthorizationURL(ctx, state)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

func (h *twitchConnectionHandler) TwitchRedemptionsCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	stateCookie, err := r.Cookie("twitch_oauth_state")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	userID, ok := h.twitchService.ParseAuthState(ctx, stateCookie.Value)
	if !ok {
		utils.HttpError(ctx, errors.New("invalid state"), w)
		return
	}

	profile, err := h.profileService.GetProfileById(ctx, userID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	code := r.URL.Query().Get("code")
	token, err := h.twitchService.ExchangeTwitchCodeForToken(ctx, code)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	helixUser, err := h.twitchService.GetTwitchHelixUser(ctx, token.AccessToken)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	twitchConnection := &db.TwitchConnection{
		OwnerID:       profile.UserID,
		BroadcasterID: helixUser.ID,
		Login:         helixUser.Login,
		AccessToken:   token.AccessToken,
		RefreshToken:  token.RefreshToken,
		ExpiresAt:     time.Now().Add(time.Duration(token.ExpiresIn) * time.Second),
	}

	err = h.twitchService.CreateTwitchConnection(ctx, twitchConnection)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
}
