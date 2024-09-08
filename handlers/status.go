package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

type statusHandler struct {
}

func NewStatusHandler() *statusHandler {
	return &statusHandler{}
}

func (h *statusHandler) Health(w http.ResponseWriter, r *http.Request) {
	response := map[string]any{
		"status": "OK",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error writing data: %v", err)
	}
}
