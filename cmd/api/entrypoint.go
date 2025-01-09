package api

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	jwtAuth "github.com/go-chi/jwtauth/v5"
	"github.com/pickle.pw/monolith/config"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/services"
)

type Pickle struct {
	profileHandler   *handlers.User
	statusHandler    *handlers.Status
	orderHandler     *handlers.Order
	gameNoteHandler  *handlers.GameNote
	migrationService *services.Migrations
	contentService   *handlers.Content
	tokenAuth        *jwtAuth.JWTAuth
}

func NewPickle(profileHandler *handlers.User, statusHandler *handlers.Status, orderHandler *handlers.Order, gameNoteHandler *handlers.GameNote, migrationService *services.Migrations, contentService *handlers.Content) *Pickle {
	return &Pickle{
		profileHandler:   profileHandler,
		statusHandler:    statusHandler,
		orderHandler:     orderHandler,
		gameNoteHandler:  gameNoteHandler,
		migrationService: migrationService,
		contentService:   contentService,
	}
}

func (p *Pickle) BuildAPI() (*chi.Mux, error) {
	// JWT
	p.tokenAuth = jwtAuth.New("HS256", config.GetJWTSecret(), nil)

	// Apply Elasticsearch migrations
	err := p.applyElasticsearchMigrations()
	if err != nil {
		return nil, fmt.Errorf("Error occurred during Elasticsearch migrations: %v", err)
	}
	log.Println("Elasticsearch migrations applied")

	r := chi.NewRouter()

	// middlewares
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)
	r.Use(chiMiddleware.Timeout(config.GetContextTimeoutMs() * time.Millisecond))

	// /v1 routes
	r.Mount("/v1", p.v1RouteHandler())
	log.Println("Mounted /v1 routes")
	return r, nil
}

func (p *Pickle) applyElasticsearchMigrations() error {
	migrations, err := p.migrationService.LoadMigrations("./db/elasticsearch/migration")
	if err != nil {
		return err
	}

	for _, migration := range migrations {
		err := p.migrationService.ApplyMigration(migration)
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *Pickle) v1RouteHandler() http.Handler {
	r := chi.NewRouter()

	// Protected routes
	r.Group(func(r chi.Router) {
		// Seek, verify and validate JWT tokens
		r.Use(jwtAuth.Verifier(p.tokenAuth))
		// Handle valid / invalid tokens. In this example, we use
		// the provided authenticator middleware, but you can write your
		// own very easily, look at the Authenticator method in jwtAuth.go
		// and tweak it, its not scary.
		r.Use(middleware.Authenticator(p.tokenAuth))

		p.registerV1ProtectedRoutes(r)
	})

	// Webhook routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.ApiKey())

		p.registerV1ApiKeyRoutes(r)
	})

	// Public routes
	r.Group(func(r chi.Router) {
		p.registerV1PublicRoutes(r)
	})

	return r
}

func (p *Pickle) registerV1ProtectedRoutes(r chi.Router) {
	r.Route("/profiles/me", func(r chi.Router) {
		r.Get("/", p.profileHandler.GetMyProfile)
		r.Patch("/", p.profileHandler.UpdateSettings)
		r.Post("/avatar", p.profileHandler.UploadAvatar)
	})

	r.Route("/game-notes", func(r chi.Router) {
		r.Post("/", p.gameNoteHandler.CreateGameNote)
	})

	r.Route("/orders", func(r chi.Router) {
		r.Post("/", p.orderHandler.CreateOrder)
		r.Patch("/{id}", p.orderHandler.UpdateOrderById)
	})
}

func (p *Pickle) registerV1ApiKeyRoutes(r chi.Router) {
	r.Route("/supabase-webhooks", func(r chi.Router) {
		r.Post("/users", p.profileHandler.CreateProfileWebhook)
		// TODO: DELETE /webhooks/supabase/users
	})
}

func (p *Pickle) registerV1PublicRoutes(r chi.Router) {
	r.Get("/health", p.statusHandler.Health)

	r.Get("/profiles/validate-link", p.profileHandler.ValidateProfileLink)
	r.Route("/profiles/{link}", func(r chi.Router) {
		r.Get("/", p.profileHandler.GetProfileByLink)
		r.Get("/game-notes", p.gameNoteHandler.GetSortedByReceiverLink)
		r.Get("/orders", p.orderHandler.GetSortedOrdersByLink)
	})

	r.Route("/game-notes/{id}", func(r chi.Router) {
		r.Get("/", p.gameNoteHandler.GetGameNoteById)
		r.Get("/orders", p.gameNoteHandler.GetOrdersById)
	})

	r.Get("/content", p.contentService.SearchContent)

	r.Route("/users", func(r chi.Router) {
		r.Get("/{id}", p.profileHandler.GetProfileById)
	})
}
