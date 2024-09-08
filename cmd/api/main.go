package api

import (
	"fmt"
	"net/http"

	"github.com/pickle.pw/monolith/handlers"
)

func StartAPI(port string) {
	v1 := http.NewServeMux()

	registerV1Routes(v1)

	mux := http.NewServeMux()
	mux.Handle("/v1/", http.StripPrefix("/v1", v1))

	fmt.Printf("Server listening on port %v", port)
	http.ListenAndServe(fmt.Sprintf(":%v", port), mux)
}

func registerV1Routes(mux *http.ServeMux) {
	statusHandler := handlers.NewStatusHandler()
	mux.HandleFunc("GET /health", statusHandler.Health)

	gameHandler := handlers.NewGamesHandler()
	mux.HandleFunc("GET /games", gameHandler.GetGames)
}
