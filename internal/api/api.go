package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	jwtAuth "github.com/go-chi/jwtauth/v5"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/schedulers"
	"github.com/pickle.pw/monolith/internal/services"
	httpSwagger "github.com/swaggo/http-swagger"
)

type PickleAPI interface {
	BuildAPI(ctx context.Context) (*chi.Mux, error)
}

type pickleAPI struct {
	profileHandler       handlers.ProfileHandler
	statusHandler        handlers.StatusHandler
	orderHandler         handlers.OrderHandler
	contentNoteHandler   handlers.ContentNoteHandler
	posterHandler        handlers.PosterHandler
	migrationService     services.MigrationService
	contentHandler       handlers.ContentHandler
	collectionHandler    handlers.CollectionHandler
	tokenAuth            *jwtAuth.JWTAuth
	moderatorHandler     handlers.ModeratorHandler
	profileEventsHandler handlers.ProfileEventsHandler
	igdbSyncScheduler    schedulers.IGDBScheduler
	igdbSyncService      services.IGDBSyncService
	tmdbSyncScheduler    schedulers.TMDBScheduler
	tmdbSyncService      services.TMDBSyncService
	authHandler          handlers.AuthHandler
	oryAPI               clients.OryAPI
}

func NewPickleAPI(
	profileHandler handlers.ProfileHandler, statusHandler handlers.StatusHandler, orderHandler handlers.OrderHandler,
	contentNoteHandler handlers.ContentNoteHandler, posterHandler handlers.PosterHandler,
	migrationService services.MigrationService, contentHandler handlers.ContentHandler,
	collectionHandler handlers.CollectionHandler, moderatorHandler handlers.ModeratorHandler,
	profileEventsHandler handlers.ProfileEventsHandler,
	igdbSyncScheduler schedulers.IGDBScheduler, igdbSyncService services.IGDBSyncService,
	tmdbSyncScheduler schedulers.TMDBScheduler, tmdbSyncService services.TMDBSyncService,
	oryAPI clients.OryAPI,
) PickleAPI {
	return &pickleAPI{
		profileHandler:       profileHandler,
		statusHandler:        statusHandler,
		orderHandler:         orderHandler,
		contentNoteHandler:   contentNoteHandler,
		posterHandler:        posterHandler,
		migrationService:     migrationService,
		contentHandler:       contentHandler,
		collectionHandler:    collectionHandler,
		moderatorHandler:     moderatorHandler,
		profileEventsHandler: profileEventsHandler,
		igdbSyncScheduler:    igdbSyncScheduler,
		igdbSyncService:      igdbSyncService,
		tmdbSyncScheduler:    tmdbSyncScheduler,
		tmdbSyncService:      tmdbSyncService,
		oryAPI:               oryAPI,
		authHandler:          handlers.NewAuthHandler(),
		tokenAuth:            jwtAuth.New("HS256", config.GetJWTSecret(), nil),
	}
}

func (api *pickleAPI) BuildAPI(ctx context.Context) (*chi.Mux, error) {
	// Apply Elasticsearch migrations
	err := api.applyElasticsearchMigrations(ctx)
	if err != nil {
		return nil, fmt.Errorf("Error occurred during Elasticsearch migrations: %v", err)
	}
	logger.Info(ctx, "Elasticsearch migrations applied")

	// Setup IGDB sync scheduler
	err = api.igdbSyncScheduler.SetupIGDBSync(ctx)
	if err != nil {
		return nil, fmt.Errorf("Error occurred during IGDB sync scheduler setup: %v", err)
	}
	logger.Info(ctx, "IGDB sync scheduler setup completed")

	// Setup TMDB sync scheduler
	err = api.tmdbSyncScheduler.SetupTMDBSync(ctx)
	if err != nil {
		return nil, fmt.Errorf("Error occurred during TMDB sync scheduler setup: %v", err)
	}
	logger.Info(ctx, "TMDB sync scheduler setup completed")

	r := chi.NewRouter()

	// middlewares
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Timeout(config.GetContextTimeoutMs() * time.Millisecond))

	// /v1 routes
	r.Mount("/v1", api.v1RouteHandler(ctx))

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
	r.Use(middleware.SessionMiddleware(api.oryAPI, false))
}

func (api *pickleAPI) useUnprotectedRoutes(r chi.Router) {
	r.Use(middleware.SessionMiddleware(api.oryAPI, true))
}

func (api *pickleAPI) useApiKey(r chi.Router) {
	r.Use(middleware.ApiKey())
}

func (api *pickleAPI) v1RouteHandler(ctx context.Context) http.Handler {
	r := chi.NewRouter()

	r.Get("/health", api.statusHandler.Health)

	r.Route("/auth", func(r chi.Router) {
		r.Post("/set-cookie", api.authHandler.SetJWTCookie)
		r.Post("/clear-cookie", api.authHandler.ClearJWTCookie)
	})

	r.Route("/webhooks", func(r chi.Router) {
		api.useApiKey(r)

		// r.Post("/users", api.profileHandler.CreateProfileWebhook)

		r.Post("/orders/{userId}", api.orderHandler.CreateOrder)
	})

	r.Route("/triggers", func(r chi.Router) {
		api.useApiKey(r)

		r.Post("/igdb-sync", api.igdbSyncService.TriggerGamesSync)
		r.Post("/tmdb-sync", func(w http.ResponseWriter, r *http.Request) {
			api.tmdbSyncService.TriggerMoviesSync(ctx, w, r)
		})
	})

	r.Route("/profiles", func(r chi.Router) {
		api.useUnprotectedRoutes(r)

		r.Get("/validate-link", api.profileHandler.ValidateProfileLink)
		r.Get("/{link}", api.profileHandler.GetProfileByLink)
	})

	r.Route("/collections/{collectionId}", func(r chi.Router) {
		r.Get("/", api.collectionHandler.GetCollectionByID)

		r.Group(func(r chi.Router) {
			api.useProtectedRoutes(r)

			r.Patch("/", api.collectionHandler.UpdateCollectionByID)
			r.Delete("/", api.collectionHandler.DeleteCollectionByID)
		})

		r.Route("/items", func(r chi.Router) {
			r.Get("/", api.collectionHandler.GetItemsByCollectionID)

			r.Group(func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.collectionHandler.AddItemToCollection)
				r.Delete("/{itemId}", api.collectionHandler.RemoveItemFromCollection)
			})
		})
	})

	r.Route("/content/{category}", func(r chi.Router) {
		r.Get("/", api.contentHandler.SearchContent)
		r.Get("/{id}", api.contentHandler.GetContentByID)
	})

	r.Route("/users", func(r chi.Router) {
		r.Route("/me", func(r chi.Router) {
			api.useProtectedRoutes(r)

			r.Get("/", api.profileHandler.GetMyProfile)
			r.Patch("/", api.profileHandler.UpdateSettings)
			r.Post("/avatar", api.profileHandler.UploadAvatar)
			r.Get("/avatar", api.profileHandler.GetMyProfileAvatarUrl)
			r.Patch("/suggestion-preferences", api.profileHandler.UpdateSuggestionPreferences)
		})

		r.Route("/{userId}", func(r chi.Router) {
			r.Get("/", api.profileHandler.GetProfileById)
			r.Get("/avatar", api.profileHandler.GetProfileAvatarUrl)

			r.Route("/follows", func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.profileHandler.FollowProfile)
				r.Delete("/", api.profileHandler.UnfollowProfile)
			})

			r.Route("/content-notes/{category}", func(r chi.Router) {
				r.Get("/", api.contentNoteHandler.GetSortedContentNotesByUserID)
				r.Get("/by-content-id/{contentId}", api.contentNoteHandler.GetNoteByContentID)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Post("/", api.contentNoteHandler.CreateContentNote)
				})

				r.Route("/reactions", func(r chi.Router) {
					api.useUnprotectedRoutes(r)

					r.Get("/", api.contentNoteHandler.GetBatchContentNoteReactions)
				})

				r.Route("/{noteId}", func(r chi.Router) {
					r.Get("/", api.contentNoteHandler.GetContentNoteById)
					r.Get("/orders", api.contentNoteHandler.GetOrdersByID)
					// r.Get("/posters", api.contentNoteHandler.GetPosterImageURL)

					r.Group(func(r chi.Router) {
						api.useProtectedRoutes(r)

						r.Delete("/", api.contentNoteHandler.DeleteContentNote)
						r.Patch("/", api.contentNoteHandler.UpdateContentNote)
						// r.Patch("/name", api.contentNoteHandler.UpdateContentNoteName)
					})

					r.Route("/reactions", func(r chi.Router) {
						r.Group(func(r chi.Router) {
							api.useUnprotectedRoutes(r)

							r.Get("/", api.contentNoteHandler.GetContentNoteReactions)
						})

						r.Group(func(r chi.Router) {
							api.useProtectedRoutes(r)

							r.Post("/", api.contentNoteHandler.AddContentNoteReaction)
							r.Delete("/", api.contentNoteHandler.RemoveContentNoteReaction)
						})
					})
				})
			})

			r.Route("/orders", func(r chi.Router) {
				r.Get("/", api.orderHandler.GetSortedOrdersByUserID)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Post("/", api.orderHandler.CreateOrder)
					r.Get("/ws", api.profileEventsHandler.GetProfileOrdersWebSocket)
				})

				r.Route("/{orderId}", func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Get("/", api.orderHandler.GetOrderByID)
					r.Patch("/", api.orderHandler.UpdateOrderByID)
				})
			})

			r.Route("/posters/previews", func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Get("/", api.posterHandler.GetPosterPreviews)
				r.Post("/", api.posterHandler.UploadPosterPreview)

				r.Route("/{previewId}", func(r chi.Router) {
					r.Get("/image", api.posterHandler.GetPosterPreviewImageURL)
					r.Delete("/", api.posterHandler.DeletePosterPreview)
				})
			})

			r.Route("/content", func(r chi.Router) {
				r.Get("/", api.contentHandler.SearchContent)
			})

			r.Route("/collections", func(r chi.Router) {
				r.Get("/", api.collectionHandler.GetCollectionsByUserID)
				r.Get("/items", api.collectionHandler.GetItemsByUserID)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Post("/", api.collectionHandler.CreateCollection)
				})
			})

			r.Route("/moderators", func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.moderatorHandler.AddModerator)
				r.Get("/", api.moderatorHandler.GetModerators)
				r.Delete("/{moderatorId}", api.moderatorHandler.DeleteModerator)
			})
		})
	})

	return r
}
