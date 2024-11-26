package middleware

import (
	"log"
	"net/http"

	"github.com/pickle.pw/monolith/utils"
)

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		jwtToken := r.Header.Get("Authorization")
		if len(jwtToken) == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		jwtToken = jwtToken[len("Bearer "):]
		if err := utils.VerifyJWTToken(jwtToken); err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			log.Printf("Error token verification: %v", err)
			return
		}

		next.ServeHTTP(w, r)
	})
}
