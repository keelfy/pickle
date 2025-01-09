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

type GameNote struct {
	userService     *services.Profile
	gameNoteService *services.GameNote
	orderService    *services.Order
}

func NewGameNoteHandler(userService *services.Profile, service *services.GameNote, orderService *services.Order) *GameNote {
	return &GameNote{
		userService:     userService,
		gameNoteService: service,
		orderService:    orderService,
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

	response := &types.GameNoteRes{}
	copier.Copy(response, gameNote)
	utils.WriteHttpJsonResponse(w, response)
}

func (handler *GameNote) GetSortedByReceiverLink(w http.ResponseWriter, r *http.Request) {
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
	utils.WriteHttpJsonResponse(w, response)
}

func (handler *GameNote) GetGameNoteById(w http.ResponseWriter, r *http.Request) {
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
	utils.WriteHttpJsonResponse(w, response)
}

func (handler *GameNote) GetOrdersById(w http.ResponseWriter, r *http.Request) {
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

	utils.WriteHttpJsonResponse(w, response)
}
