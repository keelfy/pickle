package utils

import (
	"net/http"
	"time"

	"github.com/pickle.pw/monolith/internal/config"
)

// SetJWTCookie sets an HTTP-only cookie with the JWT access token
func SetJWTCookie(w http.ResponseWriter, token string, maxAge int) {
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   !config.IsDebug(), // Use secure cookies in production, allow non-secure in debug mode
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)
}

// ClearJWTCookie clears the JWT access token cookie
func ClearJWTCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   !config.IsDebug(),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(-time.Hour),
	}
	http.SetCookie(w, cookie)
}

// SetJWTCookieWithExpiry sets an HTTP-only cookie with the JWT access token and specific expiry time
func SetJWTCookieWithExpiry(w http.ResponseWriter, token string, expiry time.Time) {
	maxAge := int(time.Until(expiry).Seconds())
	SetJWTCookie(w, token, maxAge)
}
