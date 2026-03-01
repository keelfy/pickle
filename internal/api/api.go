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
	userHandler          handlers.UserHandler
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
	oryAPI               clients.OryAPI
	followerHandler      handlers.FollowerHandler
}

func NewPickleAPI(
	userHandler handlers.UserHandler,
	profileHandler handlers.ProfileHandler,
	statusHandler handlers.StatusHandler,
	orderHandler handlers.OrderHandler,
	contentNoteHandler handlers.ContentNoteHandler,
	posterHandler handlers.PosterHandler,
	migrationService services.MigrationService,
	contentHandler handlers.ContentHandler,
	collectionHandler handlers.CollectionHandler,
	moderatorHandler handlers.ModeratorHandler,
	profileEventsHandler handlers.ProfileEventsHandler,
	igdbSyncScheduler schedulers.IGDBScheduler,
	igdbSyncService services.IGDBSyncService,
	tmdbSyncScheduler schedulers.TMDBScheduler,
	tmdbSyncService services.TMDBSyncService,
	oryAPI clients.OryAPI,
	followerHandler handlers.FollowerHandler,
) PickleAPI {
	return &pickleAPI{
		userHandler:          userHandler,
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
		tokenAuth:            jwtAuth.New("HS256", config.GetJWTSecret(), nil),
		followerHandler:      followerHandler,
	}
}

func (api *pickleAPI) BuildAPI(ctx context.Context) (*chi.Mux, error) {
	// Setup IGDB sync scheduler
	err := api.igdbSyncScheduler.SetupIGDBSync(ctx)
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
	r.Use(middleware.LocaleMiddleware())
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

	r.Route("/webhooks", func(r chi.Router) {
		api.useApiKey(r)

		r.Post("/ory/users", api.userHandler.AfterOryRegistrationWebhook)
		r.Post("/orders/{userId}", api.orderHandler.CreateOrderWebhook)
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

		r.Get("/{username}", api.profileHandler.GetProfileByUsername)
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

				r.Delete("/{itemId}", api.collectionHandler.RemoveItemFromCollection)
			})
		})
	})

	r.Route("/content-notes/{category}/{contentNoteId}", func(r chi.Router) {
		r.Get("/", api.contentNoteHandler.GetDetailedContentNoteByID)
		r.Get("/orders", api.contentNoteHandler.GetOrdersByContentNoteID)

		r.Group(func(r chi.Router) {
			api.useProtectedRoutes(r)

			r.Delete("/", api.contentNoteHandler.DeleteContentNote)
			r.Patch("/", api.contentNoteHandler.UpdateContentNote)
		})

		r.Route("/reactions", func(r chi.Router) {
			r.Group(func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.contentNoteHandler.AddContentNoteReaction)
				r.Delete("/", api.contentNoteHandler.RemoveContentNoteReaction)
			})
		})
	})

	r.Route("/content/{category}", func(r chi.Router) {
		r.Get("/", api.contentHandler.SearchContent)
		r.Get("/{contentId}", api.contentHandler.GetContentByID)
	})

	r.Route("/users", func(r chi.Router) {
		r.Get("/validate-username", api.userHandler.ValidateUsername)

		r.Route("/me", func(r chi.Router) {
			api.useProtectedRoutes(r)

			r.Get("/", api.userHandler.GetMe)
			r.Patch("/", api.userHandler.UpdateUser)
			r.Post("/avatar", api.userHandler.UploadAvatarForMyProfile)
			r.Get("/avatar", api.userHandler.GetMyAvatarURL)
		})

		r.Route("/{userId}", func(r chi.Router) {
			r.Get("/", api.userHandler.GetUserByID)
			r.Get("/avatar", api.userHandler.GetUserAvatarURL)

			r.Route("/follows", func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.followerHandler.FollowUser)
				r.Delete("/", api.followerHandler.UnfollowUser)
			})

			r.Route("/content-notes/{category}", func(r chi.Router) {
				r.Get("/", api.contentNoteHandler.GetSortedContentNotesByUserID)
				r.Get("/by-content-id/{contentId}", api.contentNoteHandler.GetContentNoteByContentID)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Post("/", api.contentNoteHandler.CreateContentNote)
				})

				r.Route("/reactions", func(r chi.Router) {
					api.useUnprotectedRoutes(r)

					r.Get("/", api.contentNoteHandler.GetBatchContentNoteReactions)
				})
			})

			r.Route("/orders", func(r chi.Router) {
				r.Get("/", api.orderHandler.GetSortedOrdersByUserID)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Post("/suggest", api.orderHandler.CreatePickleSuggestionOrder)
					r.Get("/ws", api.profileEventsHandler.GetProfileOrdersWebSocket)
				})

				r.Route("/{orderId}", func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Get("/", api.orderHandler.GetOrderByID)
					r.Post("/approve", api.orderHandler.ApproveOrderByID)
					r.Post("/reject", api.orderHandler.RejectOrderByID)
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
				r.Get("/", api.contentHandler.SearchProfileContent)
			})

			r.Route("/collections", func(r chi.Router) {
				r.Get("/", api.collectionHandler.GetCollectionsByUserID)
				r.Get("/items", api.collectionHandler.GetItemsByUserID)

				r.Group(func(r chi.Router) {
					api.useProtectedRoutes(r)

					r.Post("/", api.collectionHandler.CreateCollection)
					r.Post("/{collectionId}/items", api.collectionHandler.AddContentToCollection)
				})
			})

			r.Route("/moderators", func(r chi.Router) {
				api.useProtectedRoutes(r)

				r.Post("/", api.moderatorHandler.AddModeratorByUsername)
				r.Get("/", api.moderatorHandler.GetModeratorsByUserID)
				r.Delete("/{moderatorId}", api.moderatorHandler.DeleteModeratorByUserIDAndModeratorID)
			})
		})
	})

	return r
}
