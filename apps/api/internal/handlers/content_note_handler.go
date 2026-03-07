package handlers

import (
	"net/http"
	"sync"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/usecases"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type ContentNoteHandler interface {
	CreateContentNote(w http.ResponseWriter, r *http.Request)
	GetSortedContentNotesByUserID(w http.ResponseWriter, r *http.Request)
	GetDetailedContentNoteByID(w http.ResponseWriter, r *http.Request)
	GetOrdersByContentNoteID(w http.ResponseWriter, r *http.Request)
	DeleteContentNote(w http.ResponseWriter, r *http.Request)
	UpdateContentNote(w http.ResponseWriter, r *http.Request)
	GetBatchContentNoteReactions(w http.ResponseWriter, r *http.Request)
	AddContentNoteReaction(w http.ResponseWriter, r *http.Request)
	RemoveContentNoteReaction(w http.ResponseWriter, r *http.Request)
	GetContentNoteByContentID(w http.ResponseWriter, r *http.Request)
}

type contentNoteHandler struct {
	orderService                         services.OrderService
	ordererService                       services.OrdererService
	posterService                        services.PosterService
	permissionService                    services.PermissionService
	avatarService                        services.AvatarService
	contentNoteService                   services.ContentNoteService
	contentNoteReactionService           services.ContentNoteReactionService
	contentService                       services.ContentService
	createContentNoteUseCase             usecases.CreateContentNoteUseCase
	getSortedContentNotesByUserIDUseCase usecases.GetSortedContentNotesByUserIDUseCase
	logger                               *zap.SugaredLogger
}

func NewContentNoteHandler(
	orderService services.OrderService,
	ordererService services.OrdererService,
	posterService services.PosterService,
	permissionService services.PermissionService,
	avatarService services.AvatarService,
	contentNoteService services.ContentNoteService,
	contentNoteReactionService services.ContentNoteReactionService,
	contentService services.ContentService,
	createContentNoteUseCase usecases.CreateContentNoteUseCase,
	getSortedContentNotesByUserIDUseCase usecases.GetSortedContentNotesByUserIDUseCase, zapLogger *zap.SugaredLogger,
) ContentNoteHandler {
	return &contentNoteHandler{
		orderService:                         orderService,
		ordererService:                       ordererService,
		posterService:                        posterService,
		permissionService:                    permissionService,
		avatarService:                        avatarService,
		contentNoteService:                   contentNoteService,
		contentNoteReactionService:           contentNoteReactionService,
		contentService:                       contentService,
		createContentNoteUseCase:             createContentNoteUseCase,
		getSortedContentNotesByUserIDUseCase: getSortedContentNotesByUserIDUseCase, logger: zapLogger,
	}
}

// @Summary Create a content note
// @Description Create a content note
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param contentNoteReq body req.CreateContentNoteReq true "Content note request"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category} [post]
func (h *contentNoteHandler) CreateContentNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	command, err := binders.BindCreateContentNoteCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = command.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	cmdResult, err := h.createContentNoteUseCase.Handle(ctx, command)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	present := presenter.PresentCreateContentNoteCommandResult(cmdResult)
	utils.WriteHttpJsonResponse(ctx, w, present)
}

// @Summary Get content notes sorted by receiver link
// @Description Get content notes sorted by receiver link
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param cursor query string false "Cursor"
// @Param limit query int false "Limit"
// @Param column query string false "Column"
// @Param direction query string false "Direction"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category} [get]
func (h *contentNoteHandler) GetSortedContentNotesByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetSortedContentNotesByUserIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	responses, err := h.getSortedContentNotesByUserIDUseCase.Handle(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, responses)
}

// @Summary Get content note by ID
// @Description Get content note by ID
// @Tags content-notes
// @Accept json
// @Produce json
// @Param category path string true "Category"
// @Param contentNoteId path string true "Content note ID"
// @Success 200 {object} any
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/content-notes/{category}/{contentNoteId} [get]
func (h *contentNoteHandler) GetDetailedContentNoteByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetContentNoteByIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentNote, err := h.contentNoteService.GetDetailedNoteByID(ctx, cmd.ID, cmd.Category)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	initialOrderer, err := h.ordererService.GetOrdererWithUserByID(ctx, contentNote.GetInitialOrdererID())
	if err != nil {
		logger.WithRequestID(ctx, h.logger).Errorf("failed to get initial orderer: %v", err)
	}

	var (
		coverURL                *string
		initialOrdererAvatarURL string
		wg                      sync.WaitGroup
	)

	wg.Add(1)
	go func() {
		coverURL = h.contentService.GetContentCoverURL(ctx, contentNote.GetContent(), cmd.CoverSize)
		wg.Done()
	}()

	if initialOrderer != nil && initialOrderer.UserID != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			initialOrdererAvatarURL, err = h.avatarService.GetAvatarURLByUserID(ctx, *initialOrderer.UserID, cmd.InitialOrdererAvatarSize)
			if err != nil {
				logger.WithRequestID(ctx, h.logger).Errorf("failed to get initial orderer avatar URL: %v", err)
			}
		}()
	}

	wg.Wait()

	initialOrdererResp := presenter.PresentOrderer(initialOrderer, initialOrdererAvatarURL)
	res := presenter.PresentDetailedContentNote(contentNote, initialOrdererResp, coverURL)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get orders by content note ID
// @Description Get orders by content note ID
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/content-notes/{category}/{contentNoteId}/orders [get]
func (h *contentNoteHandler) GetOrdersByContentNoteID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetOrdersByContentNoteIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var (
		group         errgroup.Group
		orders        []*domain.Order
		totalElements int64
	)

	group.Go(func() error {
		orders, err = h.orderService.GetOrdersByContentNoteID(ctx, cmd)
		return err
	})

	group.Go(func() error {
		totalElements, err = h.contentNoteService.CountOrdersByContentNoteID(ctx, cmd.Category, cmd.ID)
		return err
	})

	if err := group.Wait(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	orderResponses := make([]*resp.Order, len(orders))

	for i := 0; i < len(orders); i++ {
		ordererAvatarURL := ""
		var ordererResp *resp.Orderer

		if orders[i].Orderer != nil {
			if orders[i].Orderer.UserID != nil {
				ordererAvatarURL, err = h.avatarService.GetAvatarURLByUserID(ctx, *orders[i].Orderer.UserID, domain.AvatarSizeSmall)
				if err != nil {
					logger.WithRequestID(ctx, h.logger).Errorf("failed to get orderer avatar URL: %v", err)
				}
			}

			ordererResp = presenter.PresentOrderer(orders[i].Orderer, ordererAvatarURL)
		}
		orderResponses[i] = presenter.PresentOrder(orders[i], ordererResp)
	}

	response := presenter.PresentPaginatedResponse(cmd.Pagination, totalElements, orderResponses)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Delete a content note
// @Description Delete a content note
// @Tags content-notes
// @Accept json
// @Produce json
// @Param contentNoteId path string true "Content note ID"
// @Param resetApprovedOrders query string true "Reset approved orders"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/content-notes/{category}/{contentNoteId} [delete]
func (h *contentNoteHandler) DeleteContentNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindDeleteContentNoteCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentNote, err := h.contentNoteService.GetContentNoteByID(ctx, cmd.ID, cmd.Category)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, contentNote.GetUserID(), domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpError(ctx, w, utils.NewForbiddenError("You are not allowed to delete this game note", nil))
		return
	}

	err = h.contentNoteService.DeleteContentNoteByID(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Update a content note
// @Description Update a content note
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Param contentNoteReq body requests.CreateContentNoteReq true "Content note request"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/content-notes/{category}/{contentNoteId} [put]
func (h *contentNoteHandler) UpdateContentNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindUpdateContentNoteCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentNote, err := h.contentNoteService.GetContentNoteByID(ctx, cmd.GetID(), cmd.GetCategory())
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.HasPermission(ctx, contentNote.GetUserID(), authUserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpError(ctx, w, utils.NewForbiddenError("You are not allowed to update this game note", nil))
		return
	}

	err = h.contentNoteService.UpdateContentNoteByID(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Get batch content note reactions
// @Description Get batch content note reactions
// @Tags content-notes
// @Accept json
// @Produce json
// @Param contentNoteIds query string true "Content note IDs"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/reactions [get]
func (h *contentNoteHandler) GetBatchContentNoteReactions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetContentNoteReactionsBatchCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	reactions, err := h.contentNoteReactionService.GetContentNoteReactions(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	response := presenter.PresentContentNoteReactionBatch(reactions)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Add content note reaction
// @Description Add content note reaction
// @Tags content-notes
// @Accept json
// @Produce json
// @Param category path string true "Category"
// @Param contentNoteId path string true "Content note ID"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/content-notes/{category}/{contentNoteId}/reactions [post]
func (h *contentNoteHandler) AddContentNoteReaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindAddContentNoteReactionCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = h.contentNoteReactionService.AddContentNoteReaction(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Remove content note reaction
// @Description Remove content note reaction
// @Tags content-notes
// @Accept json
// @Produce json
// @Param category path string true "Category"
// @Param contentNoteId path string true "Content note ID"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId}/reactions [delete]
func (h *contentNoteHandler) RemoveContentNoteReaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindRemoveContentNoteReactionCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = h.contentNoteReactionService.RemoveContentNoteReaction(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Search content note by content ID
// @Description Search content note by content ID
// @Tags content-notes
// @Accept json
// @Produce json
// @Param contentId path string true "Content ID"
// @Param category path string true "Category"
// @Success 200 {object} models.ContentNote
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/by-content-id/{contentId} [get]
func (h *contentNoteHandler) GetContentNoteByContentID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := binders.BindPathVariableAsUUID(r, "userId")
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentID, err := binders.BindPathVariableAsUUID(r, "contentId")
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	category, err := binders.BindPathVariableAsContentVariable(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentNote, err := h.contentNoteService.GetContentNoteByContentID(ctx, category, contentID, userID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, contentNote)
}
