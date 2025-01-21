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
	httpSwagger "github.com/swaggo/http-swagger"
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

// @title Pickle API
// @version 1.0
// @description This is a Pickle server.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host api.pickle.pw
// @BasePath /v1
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

	// swagger endpoint
	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	logger.Info(ctx, "API is ready")
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

func (api *pickleAPI) useProtectedRoutes(r chi.Router) {
	r.Use(jwtAuth.Verifier(api.tokenAuth), middleware.Authenticator(api.tokenAuth))
}

func (api *pickleAPI) useApiKey(r chi.Router) {
	r.Use(middleware.ApiKey())
}

func (api *pickleAPI) v1RouteHandler() http.Handler {
	r := chi.NewRouter()

	r.Get("/health", api.statusHandler.Health)

	r.Route("/supabase-webhooks", func(r chi.Router) {
		api.useApiKey(r)

		r.Post("/users", api.profileHandler.CreateProfileWebhook)
	})

	r.Route("/profiles", func(r chi.Router) {
		r.Get("/validate-link", api.profileHandler.ValidateProfileLink)

		// for optimization purposes, so user can get all of profile data asynchronously
		r.Route("/{link}", func(r chi.Router) {
			r.Get("/", api.profileHandler.GetProfileByLink)
			r.Get("/game-notes", api.gameNoteHandler.GetSortedByReceiverLink)
			r.Get("/orders", api.orderHandler.GetSortedOrdersByLink)
		})

		r.Route("/me", func(r chi.Router) {
			api.useProtectedRoutes(r)

			r.Get("/", api.profileHandler.GetMyProfile)
			r.Patch("/", api.profileHandler.UpdateSettings)
			r.Post("/avatar", api.profileHandler.UploadAvatar)
			r.Get("/avatar", api.profileHandler.GetMyProfileAvatarUrl)
		})
	})

	r.Route("/users/{userId}", func(r chi.Router) {
		r.Get("/", api.profileHandler.GetProfileById)
		r.Get("/avatar", api.profileHandler.GetProfileAvatarUrl)

		r.Route("/game-notes", func(r chi.Router) {
			r.Group(func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.gameNoteHandler.CreateGameNote)
			})

			r.Route("/{noteId}", func(r chi.Router) {
				r.Get("/", api.gameNoteHandler.GetGameNoteById)
				r.Get("/orders", api.gameNoteHandler.GetOrdersById)
				r.Get("/posters", api.gameNoteHandler.GetPosterImageURL)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Delete("/", api.gameNoteHandler.DeleteGameNote)
					r.Patch("/", api.gameNoteHandler.UpdateGameNote)
				})
			})
		})

		r.Route("/orders", func(r chi.Router) {
			r.Group(func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.orderHandler.CreateOrder)
			})

			r.Route("/{orderId}", func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Get("/", api.orderHandler.GetOrderByID)
				r.Patch("/", api.orderHandler.UpdateOrderByID)
			})
		})

		r.Route("/posters", func(r chi.Router) {
			api.useProtectedRoutes(r)

			r.Post("/", api.posterHandler.UploadPoster)
		})

		r.Route("/content", func(r chi.Router) {
			r.Get("/", api.contentService.SearchContent)
		})
	})

	return r
}
