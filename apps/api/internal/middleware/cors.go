package middleware

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/rs/cors"
)

func CORS(handler http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   config.GetCorsAllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PATCH", "DELETE"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	return c.Handler(handler)
}
