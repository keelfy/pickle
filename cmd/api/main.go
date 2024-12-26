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
	"github.com/pickle.pw/monolith/internal/ctx"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/storage"
)

var tokenAuth *jwtAuth.JWTAuth

func StartAPI(port string) {
	// Database connection
	pgxpool := storage.InitPGXPool()
	defer pgxpool.Close()

	// JWT
	tokenAuth = jwtAuth.New("HS256", config.GetJWTSecret(), nil)

	// Init application context
	ctx := ctx.NewContext(pgxpool)

	r := chi.NewRouter()

	// middlewares
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.CORS)
	r.Use(chiMiddleware.Timeout(config.GetContextTimeoutMs() * time.Millisecond))

	// /v1 routes
	r.Mount("/v1", v1RouteHandler(ctx))

	log.Println("Server listening on port", port)
	http.ListenAndServe(fmt.Sprintf(":%v", port), r)
}

func v1RouteHandler(ctx *ctx.Context) http.Handler {
	r := chi.NewRouter()

	// Protected routes
	r.Group(func(r chi.Router) {
		// Seek, verify and validate JWT tokens
		r.Use(jwtAuth.Verifier(tokenAuth))
		// Handle valid / invalid tokens. In this example, we use
		// the provided authenticator middleware, but you can write your
		// own very easily, look at the Authenticator method in jwtAuth.go
		// and tweak it, its not scary.
		r.Use(middleware.Authenticator(tokenAuth))

		registerV1ProtectedRoutes(ctx, r)
	})

	// Webhook routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.ApiKey())

		registerV1ApiKeyRoutes(ctx, r)
	})

	// Public routes
	r.Group(func(r chi.Router) {
		registerV1PublicRoutes(ctx, r)
	})

	return r
}

func registerV1ProtectedRoutes(ctx *ctx.Context, r chi.Router) {
	r.Route("/profiles/me", func(r chi.Router) {
		r.Get("/", ctx.Handler.User.GetMyProfile)
		r.Patch("/", ctx.Handler.User.UpdateSettings)
		r.Post("/avatar", ctx.Handler.User.UploadAvatar)
	})

	r.Route("/game-notes", func(r chi.Router) {
		r.Post("/", ctx.Handler.GameNote.CreateGameNote)
	})

	r.Route("/orders", func(r chi.Router) {
		r.Post("/", ctx.Handler.Order.CreateOrder)
		r.Patch("/{id}", ctx.Handler.Order.UpdateOrderById)
	})
}

func registerV1ApiKeyRoutes(ctx *ctx.Context, r chi.Router) {
	r.Route("/supabase-webhooks", func(r chi.Router) {
		r.Post("/users", ctx.Handler.User.CreateProfileWebhook)
		// TODO: DELETE /webhooks/supabase/users
	})
}

func registerV1PublicRoutes(ctx *ctx.Context, r chi.Router) {
	r.Get("/health", ctx.Handler.Status.Health)

	r.Get("/profiles/validate-link", ctx.Handler.User.ValidateProfileLink)
	r.Route("/profiles/{link}", func(r chi.Router) {
		r.Get("/", ctx.Handler.User.GetProfileByLink)
		r.Get("/game-notes", ctx.Handler.GameNote.GetByReceiverLink)
		r.Get("/orders", ctx.Handler.Order.GetSortedOrdersByLink)
	})

	r.Route("/users", func(r chi.Router) {
		r.Get("/{id}", ctx.Handler.User.GetProfileById)
	})
}
