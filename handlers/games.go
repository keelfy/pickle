package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pickle.pw/monolith/repo"
	"github.com/pickle.pw/monolith/utils"
)

type Game struct {
	gameRepo *repo.Games
}

func NewGamesHandler(gameRepo *repo.Games) *Game {
	return &Game{gameRepo: gameRepo}
}

func (h *Game) GetGames(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Has("query") {
		h.SearchForAGame(w, r)
		return
	}

	from, to, _, _ := utils.GetPagination(r)
	response, err := h.gameRepo.GetGames(from, to)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
}

func (h *Game) SearchForAGame(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")

	from, to, _, _ := utils.GetPagination(r)
	response, err := h.gameRepo.SearchForAGame(query, from, to)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error occurred during data marshalling: %v", err)
	}
}
