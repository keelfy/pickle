package middleware

import (
	"net/http"

	"github.com/rs/cors"
)

func CORS(handler http.Handler) http.Handler {
	// Setup CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},         // Allow frontend origin
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},        // Allow these methods
		AllowedHeaders:   []string{"Content-Type", "Authorization"}, // Allow custom headers
		AllowCredentials: true,                                      // Allow credentials like cookies, tokens
	})

	return c.Handler(handler)
}
