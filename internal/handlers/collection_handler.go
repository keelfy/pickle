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
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type CollectionHandler interface {
	CreateCollection(w http.ResponseWriter, r *http.Request)
	DeleteCollectionByID(w http.ResponseWriter, r *http.Request)
	UpdateCollectionByID(w http.ResponseWriter, r *http.Request)
	AddItemToCollection(w http.ResponseWriter, r *http.Request)
	RemoveItemFromCollection(w http.ResponseWriter, r *http.Request)
	GetCollectionsByUserID(w http.ResponseWriter, r *http.Request)
	GetItemsByUserID(w http.ResponseWriter, r *http.Request)
	GetCollectionByID(w http.ResponseWriter, r *http.Request)
	GetItemsByCollectionID(w http.ResponseWriter, r *http.Request)
}

type collectionHandler struct {
	collectionService services.CollectionService
	contentService    services.ContentService
}

func NewCollectionHandler(collectionService services.CollectionService, contentService services.ContentService) CollectionHandler {
	return &collectionHandler{collectionService: collectionService, contentService: contentService}
}

// @Summary Create collection
// @Description Create collection
// @Tags collections
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param name body string true "Name"
// @Success 200 {object} types.CollectionRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/collections [post]
func (h *collectionHandler) CreateCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req := &types.CreateCollectionReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		utils.HttpError(ctx, errors.NewBadRequestError("invalid request body", err), w)
		return
	}

	collection, err := h.collectionService.CreateCollection(ctx, userID, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.CollectionRes{}
	copier.Copy(res, collection)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Delete collection
// @Description Delete collection
// @Tags collections
// @Accept json
// @Produce json
// @Param collectionId path string true "Collection ID"
// @Success 200 {object} string
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/collections/{collectionId} [delete]
func (h *collectionHandler) DeleteCollectionByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collectionID, err := utils.ReadPathUUIDVariable("collectionId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = h.collectionService.DeleteCollection(ctx, collectionID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Update collection
// @Description Update collection
// @Tags collections
// @Accept json
// @Produce json
// @Param collectionId path string true "Collection ID"
// @Body types.UpdateCollectionReq true "Update collection request"
// @Success 200 {object} types.CollectionRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/collections/{collectionId} [patch]
func (h *collectionHandler) UpdateCollectionByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collectionID, err := utils.ReadPathUUIDVariable("collectionId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req := &types.UpdateCollectionReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		utils.HttpError(ctx, errors.NewBadRequestError("invalid request body", err), w)
		return
	}

	collection, err := h.collectionService.UpdateCollection(ctx, collectionID, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.CollectionRes{}
	copier.Copy(res, collection)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Add item to collection
// @Description Add item to collection
// @Tags collections
// @Accept json
// @Produce json
// @Param collectionId path string true "Collection ID"
// @Param noteId path string true "Note ID"
// @Param category body string true "Category"
// @Success 200 {object} types.CollectionItemRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/collections/{collectionId}/items [post]
func (h *collectionHandler) AddItemToCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collectionID, err := utils.ReadPathUUIDVariable("collectionId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	req := &types.AddItemToCollectionReq{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		utils.HttpError(ctx, errors.NewBadRequestError("invalid request body", err), w)
		return
	}

	posterSize := utils.GetQueryParam(r, "posterSize", "sm")

	content, err := h.contentService.GetContentByID(ctx, req.NoteID, req.Category)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	createdItem, err := h.collectionService.AddItemToCollection(ctx, collectionID, content)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.CollectionItemRes{}
	copier.Copy(res, createdItem)
	res.Content = types.ContentRes{
		ID:       content.GetID(),
		Name:     content.GetName(),
		UserID:   content.GetUserID(),
		Category: content.GetCategory(),
	}

	posterURL, err := h.contentService.GetContentPosterImageURL1(ctx, posterSize, content)
	if err != nil {
		logger.Errorf(ctx, "failed to get poster image URL for %s %s: %v", content.GetCategory(), content.GetID(), err)
	} else {
		res.PosterURL = posterURL
	}

	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Remove item from collection
// @Description Remove item from collection
// @Tags collections
// @Accept json
// @Produce json
// @Param collectionId path string true "Collection ID"
// @Param itemId path string true "Item ID"
// @Success 200 {object} string
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/collections/{collectionId}/items/{itemId} [delete]
func (h *collectionHandler) RemoveItemFromCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collectionID, err := utils.ReadPathUUIDVariable("collectionId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	itemID, err := utils.ReadPathUUIDVariable("itemId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = h.collectionService.RemoveItemFromCollection(ctx, collectionID, itemID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// @Summary Get collections by user ID
// @Description Get collections by user ID
// @Tags collections
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} []types.CollectionRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/collections [get]
func (h *collectionHandler) GetCollectionsByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	collections, err := h.collectionService.GetByUserID(ctx, userID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := make([]*types.CollectionRes, len(collections))
	copier.Copy(&res, &collections)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get items by user ID
// @Description Get items by user ID
// @Tags collections
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} []types.CollectionItemRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/collections/items [get]
func (h *collectionHandler) GetItemsByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	posterSize := utils.GetQueryParam(r, "posterSize", "sm")

	pagination, err := utils.GetPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	items, err := h.collectionService.GetItemsByUserID(ctx, userID, pagination)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	collectionCount := 0
	groupedItems := make(map[uuid.UUID][]types.CollectionItemRes)

	for _, item := range items {
		if _, ok := groupedItems[item.CollectionID]; !ok {
			groupedItems[item.CollectionID] = []types.CollectionItemRes{}
			collectionCount++
		}

		posterURL := ""
		if item.PosterKey != nil {
			posterURL, err = h.contentService.GetContentPosterImageURL(ctx, item.Category, posterSize, *item.PosterKey, item.PosterUpdatedAt.Time)
			if err != nil {
				logger.Errorf(ctx, "failed to get poster image URL for %s %s: %v", item.Category, item.NoteID, err)
			}
		}

		contentName := ""
		if item.ContentName != nil {
			contentName = *item.ContentName
		}

		groupedItems[item.CollectionID] = append(groupedItems[item.CollectionID], types.CollectionItemRes{
			ID: item.ID,
			Content: types.ContentRes{
				ID:       item.NoteID,
				Name:     contentName,
				UserID:   userID,
				Category: item.Category,
			},
			PosterURL: posterURL,
		})
	}

	res := make([]types.BatchCollectionItemsRes, collectionCount)

	currentIndex := 0

	var group sync.WaitGroup

	group.Add(len(groupedItems))
	for collectionID, items := range groupedItems {
		go func(collectionID uuid.UUID, items []types.CollectionItemRes, index int) {
			defer group.Done()
			totalElements, err := h.collectionService.CountCollectionItemsByCollectionID(ctx, collectionID)
			if err != nil {
				utils.HttpError(ctx, err, w)
				return
			}

			res[index] = types.BatchCollectionItemsRes{
				CollectionID: collectionID,
				PaginatedRes: types.PaginatedRes[types.CollectionItemRes]{
					Content:       items,
					Page:          pagination.Page,
					Size:          pagination.Size,
					TotalElements: totalElements,
					TotalPages:    utils.CalculateTotalPages(totalElements, pagination.Size),
				},
			}
		}(collectionID, items, currentIndex)
		currentIndex++
	}
	group.Wait()

	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get collection by ID
// @Description Get collection by ID
// @Tags collections
// @Accept json
// @Produce json
// @Param collectionId path string true "Collection ID"
// @Success 200 {object} types.CollectionRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/collections/{collectionId} [get]
func (h *collectionHandler) GetCollectionByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collectionID, err := utils.ReadPathUUIDVariable("collectionId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	collection, err := h.collectionService.GetByID(ctx, collectionID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.CollectionRes{}
	copier.Copy(res, collection)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get items by collection ID
// @Description Get items by collection ID
// @Tags collections
// @Accept json
// @Produce json
// @Param collectionId path string true "Collection ID"
// @Success 200 {object} []types.CollectionItemRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/collections/{collectionId}/items [get]
func (h *collectionHandler) GetItemsByCollectionID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	collectionID, err := utils.ReadPathUUIDVariable("collectionId", r)
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
		totalElements int64
		items         []*db.FindCollectionItemsByCollectionIDWithContentRow
	)

	group.Go(func() error {
		totalElements, err = h.collectionService.CountCollectionItemsByCollectionID(ctx, collectionID)
		if err != nil {
			return err
		}
		return nil
	})

	group.Go(func() error {
		items, err = h.collectionService.GetItemsByCollectionID(ctx, collectionID, pagination)
		if err != nil {
			return err
		}
		return nil
	})

	if err := group.Wait(); err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	posterSize := utils.GetQueryParam(r, "posterSize", "sm")

	res := make([]types.CollectionItemRes, len(items))
	for i, item := range items {
		itemRes := types.CollectionItemRes{}
		copier.Copy(&itemRes, &item)

		contentName := ""
		if item.ContentName != nil {
			contentName = *item.ContentName
		}

		itemRes.Content = types.ContentRes{
			ID:       item.NoteID,
			Name:     contentName,
			UserID:   uuid.Nil,
			Category: item.Category,
		}

		if item.PosterKey != nil {
			posterURL, err := h.contentService.GetContentPosterImageURL(ctx, item.Category, posterSize, *item.PosterKey, item.PosterUpdatedAt.Time)
			if err != nil {
				logger.Errorf(ctx, "failed to get poster image URL for %s %s: %v", item.Category, item.NoteID, err)
			} else {
				itemRes.PosterURL = posterURL
			}
		}
		res[i] = itemRes
	}

	paginatedRes := utils.FillPaginatedResponse(res, totalElements, pagination)
	utils.WriteHttpJsonResponse(ctx, w, paginatedRes)
}
