package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pickle.pw/monolith/repositories"
	"github.com/pickle.pw/monolith/utils"
)

type gameHandler struct {
}

func NewGamesHandler() *gameHandler {
	return &gameHandler{}
}

func (h *gameHandler) GetGames(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Has("query") {
		h.SearchForAGame(w, r)
		return
	}

	from, to := utils.GetPagination(r)
	response, err := repositories.GetGames(from, to)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
}

func (h *gameHandler) SearchForAGame(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")

	from, to := utils.GetPagination(r)
	response, err := repositories.SearchForAGame(query, from, to)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
}
