package middleware

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/jwtauth/v5"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
)

var (
	cookieName = config.GetSupabaseTokenCookieName()
)

// TokenFromCookieOrHeader is a custom TokenFinder that searches for a JWT token in:
// 1. Authorization header (Bearer token)
// 2. HTTP-only cookie named "access_token"
func TokenFromCookieOrHeader(r *http.Request) string {
	// First, try to get token from Authorization header (existing functionality)
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "Bearer ") {
			return strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	// If no token in header, try to get from cookie
	cookie, err := r.Cookie(fmt.Sprintf("%s.0", cookieName))
	if err == nil && cookie.Value != "" && strings.HasPrefix(cookie.Value, "base64-") {
		value := cookie.Value
		cookie2, err2 := r.Cookie(fmt.Sprintf("%s.1", cookieName))
		if err2 == nil && cookie2.Value != "" {
			value = value + cookie2.Value
		}

		encoded := strings.TrimPrefix(value, "base64-")
		logger.Debugf(r.Context(), "Found token in cookie: '%s'", encoded)
		jsonStr, err := base64.RawURLEncoding.DecodeString(encoded)
		if err != nil {
			logger.Errorf(r.Context(), "Error decoding token: %v", err)
			return ""
		}

		logger.Debugf(r.Context(), "Found token in cookie: %s", jsonStr)
		var token struct {
			AccessToken string `json:"access_token"`
		}
		err = json.Unmarshal(jsonStr, &token)
		if err != nil {
			return ""
		}

		logger.Debugf(r.Context(), "Found token in cookie: %s", token.AccessToken)
		return token.AccessToken
	}

	return ""
}

// VerifierWithCookieSupport is a middleware that verifies JWT tokens from both
// Authorization header and HTTP-only cookies. It uses the existing jwtauth.Verify
// with custom token finders to support both authentication methods.
func VerifierWithCookieSupport(ja *jwtauth.JWTAuth) func(http.Handler) http.Handler {
	return jwtauth.Verify(ja, TokenFromCookieOrHeader)
}
