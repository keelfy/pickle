package api

import (
	"fmt"
	"log"
	"net/http"

	"github.com/pickle.pw/monolith/ctx"
	"github.com/pickle.pw/monolith/middleware"
	"github.com/pickle.pw/monolith/storage"
)

func StartAPI(port string) {
	// Init Supabase client
	sb := storage.InitSupabase()

	// Init application context
	ctx := ctx.NewContext(sb)

	// v1 route
	v1 := http.NewServeMux()

	registerV1Routes(ctx, v1)

	mux := http.NewServeMux()
	mux.Handle("/v1/", http.StripPrefix("/v1", middleware.Logger(v1)))

	log.Println("Server listening on port", port)
	http.ListenAndServe(fmt.Sprintf(":%v", port), middleware.CORS(mux))
}

func registerV1Routes(ctx *ctx.Context, mux *http.ServeMux) {
	private := http.NewServeMux()

	mux.HandleFunc("GET /health", ctx.Handler.Status.Health)

	mux.HandleFunc("GET /users/{id}", ctx.Handler.User.GetUserDetails)

	mux.HandleFunc("GET /games", ctx.Handler.Game.GetGames)

	mux.HandleFunc("GET /users/{id}/game-notes", ctx.Handler.GameNote.GetGameNotesByUserId)
	mux.HandleFunc("GET /users/by-link/{link}/game-notes", ctx.Handler.GameNote.GetGameNotesByLink)
	private.HandleFunc("POST /game-notes", ctx.Handler.GameNote.CreateGameNote)

	mux.HandleFunc("GET /users/by-link/{link}/orders", ctx.Handler.Order.GetOrdersByLink)

	mux.Handle("/", middleware.Auth(private))
}
