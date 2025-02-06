package middleware

import (
	"context"
	"net/http"

	"github.com/go-chi/jwtauth/v5"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/logger"
)

const UserIDKey string = "authUserID"

func Authenticator(ja *jwtauth.JWTAuth, required bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		hfn := func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			token, _, err := jwtauth.FromContext(ctx)
			if err != nil {
				if required {
					http.Error(w, err.Error(), http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			if token == nil {
				if required {
					logger.Warnf(ctx, "Authorization is required")
					http.Error(w, "Authorization is required", http.StatusUnauthorized)
					return
				}
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			userId := token.Subject()
			uid, err := uuid.Parse(userId)
			if err != nil {
				if required {
					http.Error(w, "Failed to parse user ID", http.StatusInternalServerError)
					return
				}
				logger.Errorf(ctx, "Failed to parse user ID: %v", err)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// User ID must be in token claim
			if uid == uuid.Nil {
				if required {
					http.Error(w, "Incorrect token claims", http.StatusUnauthorized)
					return
				}
				logger.Errorf(ctx, "Incorrect token claims: %v", err)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			ctx = context.WithValue(ctx, UserIDKey, uid)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(hfn)
	}
}
