package middleware

import (
	"context"
	"log"
	"net/http"

	"github.com/go-chi/jwtauth/v5"
	"github.com/google/uuid"
)

const UserIDKey string = "authUserID"

func Authenticator(ja *jwtauth.JWTAuth) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			token, _, err := jwtauth.FromContext(r.Context())
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}

			if token == nil {
				log.Printf("Authorization is required")
				http.Error(w, "Authorization is required", http.StatusUnauthorized)
				return
			}

			userId := token.Subject()
			uid, err := uuid.Parse(userId)
			if err != nil {
				log.Printf("Failed to parse user ID: %v", err)
				http.Error(w, "Failed to parse user ID", http.StatusInternalServerError)
				return
			}

			// User ID must be in token claim
			if uid == uuid.Nil {
				log.Printf("Incorrect token claims: %v", err)
				http.Error(w, "Incorrect token claims", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, uid)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(hfn)
	}
}
