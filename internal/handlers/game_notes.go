package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type GameNote struct {
	userService     *services.User
	gameNoteService *services.GameNote
}

func NewGameNoteHandler(userService *services.User, service *services.GameNote) *GameNote {
	return &GameNote{
		userService:     userService,
		gameNoteService: service,
	}
}

func (h *GameNote) CreateGameNote(w http.ResponseWriter, r *http.Request) {
	// Unmarshal the request body
	req := &types.CreateGameNoteReq{}
	json.NewDecoder(r.Body).Decode(req)

	// Extract JWT token from the req
	ctx := r.Context()
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)

	err := h.gameNoteService.ValidateCreateGameNote(req, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Business logic of GameNote creation
	gameNote, err := h.gameNoteService.CreateGameNote(ctx, req, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Response headers
	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	// Response body
	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error data marshalling: %v", err)
	}
}

func (handler *GameNote) GetByReceiverLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	link, err := utils.ReadPathVariable("link", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	sort, err := utils.GetSortedPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	receiver, err := handler.userService.GetProfileByLink(ctx, link)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	gameNotes, err := handler.gameNoteService.GetByReceiverId(ctx, receiver.UserID, sort)
	if err != nil {
		utils.HttpError(ctx, err, w)
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
