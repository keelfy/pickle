package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
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
	DeleteGameNote(w http.ResponseWriter, r *http.Request)
	UpdateGameNote(w http.ResponseWriter, r *http.Request)
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

// @Summary Create a game note
// @Description Create a game note
// @Tags game-notes
// @Accept json
// @Produce json
// @Param gameNoteReq body types.GameNoteReq true "Game note request"
// @Success 200 {object} types.GameNoteRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/game-notes [post]
func (h *gameNoteHandler) CreateGameNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)

	req := &types.GameNoteReq{}
	err := json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Business logic of GameNote creation
	gameNote, err := h.gameNoteService.CreateGameNote(ctx, userId, userId, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get game notes sorted by receiver link
// @Description Get game notes sorted by receiver link
// @Tags game-notes
// @Accept json
// @Produce json
// @Param link path string true "Link"
// @Success 200 {object} []types.GameNoteRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/game-notes/sorted-by-receiver-link/{link} [get]
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
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	gameNote, err := handler.gameNoteService.GetById(ctx, noteId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get orders by game note ID
// @Description Get orders by game note ID
// @Tags game-notes
// @Accept json
// @Produce json
// @Param noteId path string true "Note ID"
// @Success 200 {object} []types.OrderRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/game-notes/{noteId}/orders [get]
func (handler *gameNoteHandler) GetOrdersById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
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
		orders, err = handler.orderService.GetPaginatedByGameNoteId(ctx, noteId, pagination)
		return err
	})

	group.Go(func() error {
		totalElements, err = handler.orderService.CountGameNotesById(ctx, noteId)
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
		TotalPages:    utils.CalculateTotalPages(totalElements, pagination.Size),
		TotalElements: totalElements,
	}

	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get poster image URL
// @Description Get poster image URL
// @Tags game-notes
// @Accept json
// @Produce json
// @Param noteId path string true "Note ID"
// @Param size query string true "Size"
// @Success 200 {object} types.ImageRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/game-notes/{noteId}/poster [get]
func (handler *gameNoteHandler) GetPosterImageURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	size := utils.GetQueryParam(r, "size", "md")
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
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

	res := &types.ImageRes{
		URL: url,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Delete a game note
// @Description Delete a game note
// @Tags game-notes
// @Accept json
// @Produce json
// @Param noteId path string true "Note ID"
// @Param resetApprovedOrders query string true "Reset approved orders"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/game-notes/{noteId} [delete]
func (handler *gameNoteHandler) DeleteGameNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)
	resetApprovedOrders := utils.GetQueryParam(r, "resetApprovedOrders", "false")
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = handler.gameNoteService.DeleteGameNoteById(ctx, noteId, userId, resetApprovedOrders == "true")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Update a game note
// @Description Update a game note
// @Tags game-notes
// @Accept json
// @Produce json
// @Param noteId path string true "Note ID"
// @Param gameNoteReq body types.GameNoteReq true "Game note request"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/game-notes/{noteId} [put]
func (handler *gameNoteHandler) UpdateGameNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := ctx.Value(middleware.UserIDKey).(uuid.UUID)
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	var req types.GameNoteReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.HttpError(ctx, errors.NewBadRequestError("Invalid request body", err), w)
		return
	}

	err = handler.gameNoteService.UpdateGameNoteById(ctx, noteId, &req, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
}
