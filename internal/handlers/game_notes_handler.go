package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type GameNoteHandler interface {
	CreateGameNote(w http.ResponseWriter, r *http.Request)
	GetSortedByReceiverLink(w http.ResponseWriter, r *http.Request)
	GetGameNoteById(w http.ResponseWriter, r *http.Request)
	GetOrdersById(w http.ResponseWriter, r *http.Request)
	GetPosterImageURL(w http.ResponseWriter, r *http.Request)
}

type gameNoteHandler struct {
	userService     services.ProfileService
	gameNoteService services.GameNoteService
	orderService    services.OrderService
	posterService   services.PosterService
}

func NewGameNoteHandler(userService services.ProfileService, service services.GameNoteService, orderService services.OrderService, posterService services.PosterService) GameNoteHandler {
	return &gameNoteHandler{
		userService:     userService,
		gameNoteService: service,
		orderService:    orderService,
		posterService:   posterService,
	}
}

func (h *gameNoteHandler) CreateGameNote(w http.ResponseWriter, r *http.Request) {
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

	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

func (handler *gameNoteHandler) GetSortedByReceiverLink(w http.ResponseWriter, r *http.Request) {
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

	response := &[]types.GameNoteRes{}
	copier.Copy(response, gameNotes)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

func (handler *gameNoteHandler) GetGameNoteById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	gameNote, err := handler.gameNoteService.GetById(ctx, id)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

func (handler *gameNoteHandler) GetOrdersById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	pagination, err := utils.GetPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	var (
		group         errgroup.Group
		orders        []*db.Order
		totalElements int64
	)

	group.Go(func() error {
		orders, err = handler.orderService.GetPaginatedByGameNoteId(ctx, id, pagination)
		return err
	})

	group.Go(func() error {
		totalElements, err = handler.orderService.CountGameNotesById(ctx, id)
		return err
	})

	if err := group.Wait(); err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	orderResponses := []types.OrderRes{}
	copier.Copy(&orderResponses, orders)

	response := &types.PaginatedRes[types.OrderRes]{
		Content:       orderResponses,
		Size:          pagination.Size,
		Page:          pagination.Page,
		TotalPages:    totalElements / int64(pagination.Size),
		TotalElements: totalElements,
	}

	utils.WriteHttpJsonResponse(ctx, w, response)
}

func (handler *gameNoteHandler) GetPosterImageURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	size := utils.GetQueryParam(r, "size", "md")
	noteId, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	note, err := handler.gameNoteService.GetById(ctx, noteId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	var url *string

	if note.PosterKey != nil && len(*note.PosterKey) > 0 {
		imageUrl, err := handler.posterService.GetPosterImageURL(ctx, "game-note", size, *note.PosterKey, note.PosterUpdatedAt)
		if err != nil {
			utils.HttpError(ctx, err, w)
			return
		}
		url = &imageUrl
	}

	utils.WriteHttpJsonResponse(ctx, w, struct {
		URL *string `json:"url"`
	}{
		URL: url,
	})
}
