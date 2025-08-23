package api

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/handler"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/middleware"
	"github.com/pickle-pw/twitch-harbor/internal/service"
)

type TwitchHarborAPI interface {
	BuildAPI(ctx context.Context) (*chi.Mux, error)
	Shutdown(ctx context.Context) error
}

type twitchHarborAPI struct {
	webhookHandler     handler.WebhookHandler
	broadcasterHandler handler.BroadcasterHandler
	oryAPI             clients.OryAPI
	twitchWSService    service.TwitchWSService
}

func NewTwitchHarborAPI(
	webhookHandler handler.WebhookHandler,
	broadcasterHandler handler.BroadcasterHandler,
	oryAPI clients.OryAPI,
	twitchWSService service.TwitchWSService,
) TwitchHarborAPI {
	return &twitchHarborAPI{
		webhookHandler:     webhookHandler,
		broadcasterHandler: broadcasterHandler,
		oryAPI:             oryAPI,
		twitchWSService:    twitchWSService,
	}
}

func (api *twitchHarborAPI) BuildAPI(ctx context.Context) (*chi.Mux, error) {
	r := chi.NewRouter()

	// middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Timeout(config.GetContextTimeoutMs() * time.Millisecond))

	prefix := config.GetAPIPrefix()

	// /v1 routes
	r.Mount(prefix+"/v1", api.v1RouteHandler())

	logger.Info(ctx, "API is ready")
	return r, nil
}

func (api *twitchHarborAPI) Shutdown(ctx context.Context) error {
	return api.twitchWSService.Shutdown(ctx)
}

func (api *twitchHarborAPI) useApiKey(r chi.Router) {
	r.Use(middleware.ApiKey())
}

func (api *twitchHarborAPI) useSession(r chi.Router) {
	r.Use(middleware.SessionMiddleware(api.oryAPI, false))
}

func (api *twitchHarborAPI) v1RouteHandler() http.Handler {
	r := chi.NewRouter()

	r.Route("/webhooks", func(r chi.Router) {
		api.useApiKey(r)

		r.Post("/after-oidc-settings-update", api.webhookHandler.HandleWebhook)
	})

	r.Route("/broadcaster/preferences", func(r chi.Router) {
		api.useSession(r)

		r.Get("/", api.broadcasterHandler.GetBroadcasterPreferences)
		r.Post("/", api.broadcasterHandler.SaveBroadcasterPreferences)
	})

	return r
}
