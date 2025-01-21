package middleware

import (
	"net/http"

	"github.com/rs/cors"
)

func CORS(handler http.Handler) http.Handler {
	// Setup CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://pickle.pw"}, // Allow frontend origin
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "PATCH", "DELETE"},  // Allow these methods
		AllowedHeaders:   []string{"*"},                                          // Allow custom headers
		AllowCredentials: true,                                                   // Allow credentials like cookies, tokens
	})
	return c.Handler(handler)
}
