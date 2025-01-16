package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	jwtAuth "github.com/go-chi/jwtauth/v5"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/services"
)

type PickleAPI interface {
	BuildAPI(ctx context.Context) (*chi.Mux, error)
}

type pickleAPI struct {
	profileHandler   handlers.ProfileHandler
	statusHandler    handlers.StatusHandler
	orderHandler     handlers.OrderHandler
	gameNoteHandler  handlers.GameNoteHandler
	posterHandler    handlers.PosterHandler
	migrationService services.MigrationService
	contentService   handlers.ContentHandler
	tokenAuth        *jwtAuth.JWTAuth
}

func NewPickleAPI(
	profileHandler handlers.ProfileHandler, statusHandler handlers.StatusHandler, orderHandler handlers.OrderHandler,
	gameNoteHandler handlers.GameNoteHandler, posterHandler handlers.PosterHandler,
	migrationService services.MigrationService, contentService handlers.ContentHandler,
) PickleAPI {
	return &pickleAPI{
		profileHandler:   profileHandler,
		statusHandler:    statusHandler,
		orderHandler:     orderHandler,
		gameNoteHandler:  gameNoteHandler,
		posterHandler:    posterHandler,
		migrationService: migrationService,
		contentService:   contentService,
		tokenAuth:        jwtAuth.New("HS256", config.GetJWTSecret(), nil),
	}
}

func (api *pickleAPI) BuildAPI(ctx context.Context) (*chi.Mux, error) {
	// Apply Elasticsearch migrations
	err := api.applyElasticsearchMigrations(ctx)
	if err != nil {
		return nil, fmt.Errorf("Error occurred during Elasticsearch migrations: %v", err)
	}
	logger.Info(ctx, "Elasticsearch migrations applied")

	r := chi.NewRouter()

	// middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Timeout(config.GetContextTimeoutMs() * time.Millisecond))

	// /v1 routes
	r.Mount("/v1", api.v1RouteHandler())
	logger.Info(ctx, "Mounted /v1 routes")
	return r, nil
}

func (api *pickleAPI) applyElasticsearchMigrations(ctx context.Context) error {
	migrations, err := api.migrationService.LoadElasticMigrations("./db/elasticsearch/migration")
	if err != nil {
		return err
	}

	for _, migration := range migrations {
		err := api.migrationService.ApplyElasticMigration(ctx, migration)
		if err != nil {
			return err
		}
	}

	return nil
}

func (api *pickleAPI) v1RouteHandler() http.Handler {
	r := chi.NewRouter()

	// Protected routes
	r.Group(func(r chi.Router) {
		// Seek, verify and validate JWT tokens
		r.Use(jwtAuth.Verifier(api.tokenAuth))
		// Handle valid / invalid tokens. In this example, we use
		// the provided authenticator middleware, but you can write your
		// own very easily, look at the Authenticator method in jwtAuth.go
		// and tweak it, its not scary.
		r.Use(middleware.Authenticator(api.tokenAuth))

		api.registerV1ProtectedRoutes(r)
	})

	// Webhook routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.ApiKey())

		api.registerV1ApiKeyRoutes(r)
	})

	// Public routes
	r.Group(func(r chi.Router) {
		api.registerV1PublicRoutes(r)
	})

	return r
}

func (api *pickleAPI) registerV1ProtectedRoutes(r chi.Router) {
	r.Route("/profiles/me", func(r chi.Router) {
		r.Get("/", api.profileHandler.GetMyProfile)
		r.Patch("/", api.profileHandler.UpdateSettings)
		r.Post("/avatar", api.profileHandler.UploadAvatar)
		r.Get("/avatar", api.profileHandler.GetMyProfileAvatarUrl)
	})

	r.Post("/posters", api.posterHandler.UploadPoster)

	r.Route("/game-notes", func(r chi.Router) {
		r.Post("/", api.gameNoteHandler.CreateGameNote)
	})

	r.Post("/game-notes/{gameNoteId}/orders/{orderId}", api.orderHandler.ApproveOrderById)

	r.Route("/orders", func(r chi.Router) {
		r.Post("/", api.orderHandler.CreateOrder)
		r.Patch("/{id}", api.orderHandler.UpdateOrderById)
	})
}

func (api *pickleAPI) registerV1ApiKeyRoutes(r chi.Router) {
	r.Route("/supabase-webhooks", func(r chi.Router) {
		r.Post("/users", api.profileHandler.CreateProfileWebhook)
		// TODO: DELETE /webhooks/supabase/users
	})
}

func (api *pickleAPI) registerV1PublicRoutes(r chi.Router) {
	r.Get("/health", api.statusHandler.Health)

	r.Get("/profiles/validate-link", api.profileHandler.ValidateProfileLink)
	r.Route("/profiles/{link}", func(r chi.Router) {
		r.Get("/", api.profileHandler.GetProfileByLink)
		r.Get("/game-notes", api.gameNoteHandler.GetSortedByReceiverLink)
		r.Get("/orders", api.orderHandler.GetSortedOrdersByLink)
	})

	r.Route("/game-notes/{id}", func(r chi.Router) {
		r.Get("/", api.gameNoteHandler.GetGameNoteById)
		r.Get("/orders", api.gameNoteHandler.GetOrdersById)
	})

	r.Get("/content", api.contentService.SearchContent)

	r.Route("/users/{id}", func(r chi.Router) {
		r.Get("/", api.profileHandler.GetProfileById)
		r.Get("/avatar", api.profileHandler.GetProfileAvatarUrl)
	})
}
