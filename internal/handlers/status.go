package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pickle.pw/monolith/internal/utils"
)

type Status struct {
}

func NewStatusHandler() *Status {
	return &Status{}
}

func (handler *Status) Health(w http.ResponseWriter, r *http.Request) {
	response := map[string]any{
		"status": "OK",
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error writing data: %v", err)
	}
}
