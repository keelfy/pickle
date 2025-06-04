package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/utils"
)

type AuthHandler interface {
	SetJWTCookie(w http.ResponseWriter, r *http.Request)
	ClearJWTCookie(w http.ResponseWriter, r *http.Request)
}

type authHandler struct{}

func NewAuthHandler() AuthHandler {
	return &authHandler{}
}

type SetJWTCookieRequest struct {
	Token  string `json:"token"`
	MaxAge *int   `json:"maxAge,omitempty"` // Optional, defaults to 24 hours
}

// @Summary Set JWT Cookie
// @Description Sets an HTTP-only cookie with the provided JWT token for authentication
// @Tags auth
// @Accept json
// @Produce json
// @Param request body SetJWTCookieRequest true "JWT token and optional max age"
// @Success 200 {object} map[string]string
// @Failure 400 {object} string
// @Router /v1/auth/set-cookie [post]
func (h *authHandler) SetJWTCookie(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req SetJWTCookieRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Token == "" {
		http.Error(w, "Token is required", http.StatusBadRequest)
		return
	}

	// Default to 24 hours if maxAge is not provided
	maxAge := 24 * 60 * 60 // 24 hours in seconds
	if req.MaxAge != nil {
		maxAge = *req.MaxAge
	}

	utils.SetJWTCookie(w, req.Token, maxAge)

	response := map[string]string{
		"message": "JWT cookie set successfully",
	}
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Clear JWT Cookie
// @Description Clears the HTTP-only JWT cookie used for authentication
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Router /v1/auth/clear-cookie [post]
func (h *authHandler) ClearJWTCookie(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	utils.ClearJWTCookie(w)

	response := map[string]string{
		"message": "JWT cookie cleared successfully",
	}
	utils.WriteHttpJsonResponse(ctx, w, response)
}
