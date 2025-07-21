package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/mapper"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/models/requests"
	"github.com/pickle.pw/monolith/internal/models/responses"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type ContentNoteHandler interface {
	CreateContentNote(w http.ResponseWriter, r *http.Request)
	GetSortedContentNotesByUserID(w http.ResponseWriter, r *http.Request)
	GetContentNoteById(w http.ResponseWriter, r *http.Request)
	GetOrdersByID(w http.ResponseWriter, r *http.Request)
	// GetPosterImageURL(w http.ResponseWriter, r *http.Request)
	DeleteContentNote(w http.ResponseWriter, r *http.Request)
	UpdateContentNote(w http.ResponseWriter, r *http.Request)
	// UpdateContentNoteName(w http.ResponseWriter, r *http.Request)
	GetContentNoteReactions(w http.ResponseWriter, r *http.Request)
	GetBatchContentNoteReactions(w http.ResponseWriter, r *http.Request)
	AddContentNoteReaction(w http.ResponseWriter, r *http.Request)
	RemoveContentNoteReaction(w http.ResponseWriter, r *http.Request)
	GetNoteByContentID(w http.ResponseWriter, r *http.Request)
}

type contentNoteHandler struct {
	profileService             services.ProfileService
	orderService               services.OrderService
	posterService              services.PosterService
	contentNoteService         services.ContentNoteService
	contentNoteReactionService services.ContentNoteReactionService
}

func NewContentNoteHandler(
	profileService services.ProfileService, orderService services.OrderService,
	posterService services.PosterService, contentNoteService services.ContentNoteService,
	contentNoteReactionService services.ContentNoteReactionService,
) ContentNoteHandler {
	return &contentNoteHandler{
		profileService:             profileService,
		orderService:               orderService,
		posterService:              posterService,
		contentNoteService:         contentNoteService,
		contentNoteReactionService: contentNoteReactionService,
	}
}

func (h *contentNoteHandler) parsePathContentCategoryVariable(r *http.Request) (db.ContentCategory, error) {
	value := r.PathValue("category")
	if len(value) == 0 {
		return "", errors.NewBadRequestError("Path variable category is required", nil)
	}

	category := db.ContentCategory(value)
	return category, nil
}

func (h *contentNoteHandler) decodeCreateContentNoteReq(category db.ContentCategory, r *http.Request) (requests.CreateContentNoteReq, error) {
	var req requests.CreateContentNoteReq

	switch category {
	case db.ContentCategoryGames:
		req = &requests.CreateGameNoteReq{}
	case db.ContentCategoryMovies:
		req = &requests.CreateMovieNoteReq{}
	default:
		return nil, errors.NewBadRequestError("Invalid content category", nil)
	}

	err := json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		return nil, errors.NewBadRequestError("Invalid request body", err)
	}
	return req, nil
}

func (h *contentNoteHandler) mapModelToResponse(model models.ContentNote, coverURL *string, ordererCount int64) (any, error) {
	switch v := model.(type) {
	case *models.GameNote:
		return mapper.MapGameNoteToGameNoteRes(v, coverURL, ordererCount), nil
	case *models.MovieNote:
		return mapper.MapMovieNoteToMovieNoteRes(v, coverURL, ordererCount), nil
	default:
		return nil, errors.NewBadRequestError("Invalid content note type", nil)
	}
}

func (h *contentNoteHandler) mapModelToSearchResultResponse(model models.ContentNoteSearchResult) (responses.ContentNoteSearchResultRes, error) {
	switch v := model.(type) {
	case *models.GameNoteSearchResult:
		res := &responses.GameNoteSearchResultRes{}
		copier.Copy(res, v)
		return res, nil
	case *models.MovieNoteSearchResult:
		res := &responses.MovieNoteSearchResultRes{}
		copier.Copy(res, v)
		return res, nil
	default:
		return nil, errors.NewBadRequestError("Invalid content note type", nil)
	}
}

// @Summary Create a content note
// @Description Create a content note
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param contentNoteReq body requests.CreateContentNoteReq true "Content note request"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category} [post]
func (h *contentNoteHandler) CreateContentNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req, err := h.decodeCreateContentNoteReq(category, r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	_, err = h.contentNoteService.CreateContentNote(ctx, category, userId, userId, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
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
// @Success 200 {object} []models.ContentNoteSearchResult
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category} [get]
func (h *contentNoteHandler) GetSortedContentNotesByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	sort, err := utils.GetSortedPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	filters, err := utils.GetFilters(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	coverSize := utils.GetQueryParam(r, "coverSize", "md")
	locale := utils.GetQueryParam(r, "locale", "en")

	receiver, err := h.profileService.GetProfileByID(ctx, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	contentNotes, err := h.contentNoteService.GetFilteredSortedByReceiverID(ctx, category, receiver.UserID, sort, filters, locale)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	responses := make([]responses.ContentNoteSearchResultRes, len(contentNotes))

	var wg sync.WaitGroup
	for i := 0; i < len(contentNotes); i++ {
		res, err := h.mapModelToSearchResultResponse(contentNotes[i])
		if err != nil {
			utils.HttpError(ctx, err, w)
			return
		}

		if contentNotes[i].GetCoverKey() != "" && contentNotes[i].GetCoverKeyType().Valid {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				posterUrl, err := h.posterService.GetCoverImageURL(ctx, coverSize, contentNotes[i].GetCoverKey(), contentNotes[i].GetCoverKeyType().ImageKeyType)
				if err != nil {
					return
				}
				res.SetCoverURL(posterUrl)
			}(i)
		}

		responses[i] = res
	}

	wg.Wait()

	utils.WriteHttpJsonResponse(ctx, w, responses)
}

// @Summary Get content note by ID
// @Description Get content note by ID
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Success 200 {object} any
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId} [get]
func (h *contentNoteHandler) GetContentNoteById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	locale := utils.GetQueryParam(r, "locale", "en")
	coverSize := utils.GetQueryParam(r, "coverSize", "md")

	var contentNote models.ContentNote
	var coverURL *string

	contentNote, err = h.contentNoteService.GetDetailedNoteByID(ctx, noteId, category, locale)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	coverKey := contentNote.GetContent().GetCoverKey()
	coverKeyType := contentNote.GetContent().GetCoverKeyType()
	if coverKey != nil && *coverKey != "" && coverKeyType.Valid {
		url, err := h.posterService.GetCoverImageURL(ctx, coverSize, *coverKey, coverKeyType.ImageKeyType)
		if err != nil {
			logger.Errorf(ctx, "Error getting poster URL: %v", err)
		} else {
			coverURL = &url
		}
	}

	res, err := h.mapModelToResponse(contentNote, coverURL, 0)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get orders by content note ID
// @Description Get orders by content note ID
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Success 200 {object} []types.OrderRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId}/orders [get]
func (h *contentNoteHandler) GetOrdersByID(w http.ResponseWriter, r *http.Request) {
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

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	var (
		group         errgroup.Group
		orders        []*models.Order
		totalElements int64
	)

	group.Go(func() error {
		orders, err = h.orderService.GetPaginatedByContentNoteID(ctx, category, noteId, pagination)
		return err
	})

	group.Go(func() error {
		totalElements, err = h.contentNoteService.CountOrdersByContentNoteID(ctx, category, noteId)
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
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Param size query string true "Size"
// @Success 200 {object} types.ImageRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId}/poster [get]
// func (h *contentNoteHandler) GetPosterImageURL(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
// 	size := utils.GetQueryParam(r, "size", "md")
// 	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
// 	if err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	category, err := h.parsePathContentCategoryVariable(r)
// 	if err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	note, err := h.contentNoteService.GetContentNoteByID(ctx, noteId, category)
// 	if err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	var imageUrl string

// 	if note.GetPosterKey() != nil && len(*note.GetPosterKey()) > 0 {
// 		imageUrl, err = h.contentNoteService.GetContentNotePosterImageURL(ctx, category, size, *note.GetPosterKey(), note.GetPosterUpdatedAt())
// 		if err != nil {
// 			utils.HttpError(ctx, err, w)
// 			return
// 		}
// 	}

// 	res := &types.ImageRes{
// 		URL: imageUrl,
// 	}
// 	utils.WriteHttpJsonResponse(ctx, w, res)
// }

// @Summary Delete a content note
// @Description Delete a content note
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Param resetApprovedOrders query string true "Reset approved orders"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId} [delete]
func (h *contentNoteHandler) DeleteContentNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	resetApprovedOrders := utils.GetQueryParam(r, "resetApprovedOrders", "false")
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = h.contentNoteService.DeleteContentNoteByID(ctx, noteId, category, resetApprovedOrders == "true")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
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
// @Router /v1/users/{userId}/content-notes/{category}/{noteId} [put]
func (h *contentNoteHandler) UpdateContentNote(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req, err := h.decodeCreateContentNoteReq(category, r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = h.contentNoteService.UpdateContentNoteByID(ctx, noteId, category, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Update a content note name
// @Description Update a content note name
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Param contentNoteReq body requests.CreateContentNoteReq true "Content note request"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId} [put]
// func (h *contentNoteHandler) UpdateContentNoteName(w http.ResponseWriter, r *http.Request) {
// 	ctx := r.Context()
// 	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
// 	if err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	category, err := h.parsePathContentCategoryVariable(r)
// 	if err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	req := &requests.ContentNoteNameReq{}
// 	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	err = h.contentNoteService.UpdateContentNoteName(ctx, noteId, category, req.Name)
// 	if err != nil {
// 		utils.HttpError(ctx, err, w)
// 		return
// 	}

// 	w.WriteHeader(http.StatusNoContent)
// }

// @Summary Get content note reactions
// @Description Get content note reactions
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Success 200 {object} []models.ReactionStack
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId}/reactions [get]
func (h *contentNoteHandler) GetContentNoteReactions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.GetUserIDFromContextOrNil(ctx)
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	reactions, err := h.contentNoteReactionService.GetContentNoteReactionsByContentNoteIDsAndUserID(ctx, category, uuid.UUIDs{noteId}, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}
	utils.WriteHttpJsonResponse(ctx, w, reactions)
}

// @Summary Get batch content note reactions
// @Description Get batch content note reactions
// @Tags content-notes
// @Accept json
// @Produce json
// @Param noteIds query string true "Note IDs"
// @Success 200 {object} []types.BatchNoteReactionsRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/reactions [get]
func (h *contentNoteHandler) GetBatchContentNoteReactions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := utils.GetUserIDFromContextOrNil(ctx)
	noteIDs, err := utils.GetQueryParamAsUUIDs(r, "noteIds")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	if len(noteIDs) == 0 {
		utils.HttpError(ctx, errors.NewBadRequestError("At least one note ID is required", nil), w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	reactions, err := h.contentNoteReactionService.GetContentNoteReactionsByContentNoteIDsAndUserID(ctx, category, noteIDs, userID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	reactionsMap := make(map[uuid.UUID][]*models.ReactionStack)
	for _, reaction := range reactions {
		reactionsMap[reaction.ContentNoteID] = append(reactionsMap[reaction.ContentNoteID], reaction)
	}

	response := []types.BatchNoteReactionsRes{}

	for _, noteID := range noteIDs {
		r, ok := reactionsMap[noteID]
		if !ok {
			r = []*models.ReactionStack{}
		}

		response = append(response, types.BatchNoteReactionsRes{
			NoteID:    noteID.String(),
			Reactions: r,
		})
	}

	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Add content note reaction
// @Description Add content note reaction
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Param reactionReq body types.ReactionReq true "Reaction request"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId}/reactions [post]
func (h *contentNoteHandler) AddContentNoteReaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req := &types.ReactionReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		utils.HttpError(ctx, errors.NewBadRequestError("Invalid request body", err), w)
		return
	}

	err = h.contentNoteReactionService.AddContentNoteReaction(ctx, category, noteId, req.EmoteID, req.Source)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Remove content note reaction
// @Description Remove content note reaction
// @Tags content-notes
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param noteId path string true "Note ID"
// @Param reactionReq body types.ReactionReq true "Reaction request"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/content-notes/{category}/{noteId}/reactions [delete]
func (h *contentNoteHandler) RemoveContentNoteReaction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	noteId, err := utils.ReadPathUUIDVariable("noteId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req := &types.ReactionReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		utils.HttpError(ctx, errors.NewBadRequestError("Invalid request body", err), w)
		return
	}

	err = h.contentNoteReactionService.RemoveContentNoteReaction(ctx, category, noteId, req.EmoteID, req.Source)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
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
func (h *contentNoteHandler) GetNoteByContentID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	contentID, err := utils.ReadPathUUIDVariable("contentId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	category, err := h.parsePathContentCategoryVariable(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	contentNote, err := h.contentNoteService.GetNoteByContentID(ctx, category, contentID, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, contentNote)
}
