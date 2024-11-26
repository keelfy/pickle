package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/repo"
	"github.com/pickle.pw/monolith/types"
	"github.com/pickle.pw/monolith/utils"
)

type GameNote struct {
	userRepo     *repo.Users
	gameNoteRepo *repo.GameNotes
}

func NewGameNoteHandler(userRepo *repo.Users, gameNoteRepo *repo.GameNotes) *GameNote {
	return &GameNote{userRepo: userRepo, gameNoteRepo: gameNoteRepo}
}

func (h *GameNote) CreateGameNote(w http.ResponseWriter, r *http.Request) {
	req := &types.CreateGameNoteReq{}
	json.NewDecoder(r.Body).Decode(req)

	tkn, err := utils.ExtractJWTToken(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	userId, err := tkn.Claims.GetSubject()
	if err != nil || len(userId) == 0 {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	model := &types.InsertGameNote{
		User:       userId,
		GameName:   req.GameName,
		Rate:       req.Rate,
		Comment:    req.Comment,
		Ordered:    req.Ordered,
		Status:     req.Status,
		FinishedAt: req.FinishedAt,
	}

	gameNote, err := h.gameNoteRepo.CreateGameNote(model)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error data marshalling: %v", err)
	}
}

func (h *GameNote) getGameNotesByUserId(userId string, w http.ResponseWriter) {
	if len(userId) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	gameNotes, err := h.gameNoteRepo.GetGameNotesByUserId(userId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &[]types.GameNoteRes{}
	copier.Copy(response, gameNotes)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error data marshalling: %v", err)
	}
}

func (h *GameNote) GetGameNotesByUserId(w http.ResponseWriter, r *http.Request) {
	userId := r.PathValue("id")
	h.getGameNotesByUserId(userId, w)
}

func (h *GameNote) GetGameNotesByLink(w http.ResponseWriter, r *http.Request) {
	link := r.PathValue("link")
	if len(link) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetUserByLink(link)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	h.getGameNotesByUserId(user.Id, w)
}
