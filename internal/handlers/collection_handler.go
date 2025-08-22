package handlers

import (
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type CollectionHandler interface {
	CreateCollection(w http.ResponseWriter, r *http.Request)
	DeleteCollectionByID(w http.ResponseWriter, r *http.Request)
	UpdateCollectionByID(w http.ResponseWriter, r *http.Request)
	AddContentToCollection(w http.ResponseWriter, r *http.Request)
	RemoveItemFromCollection(w http.ResponseWriter, r *http.Request)
	GetCollectionsByUserID(w http.ResponseWriter, r *http.Request)
	GetItemsByUserID(w http.ResponseWriter, r *http.Request)
	GetCollectionByID(w http.ResponseWriter, r *http.Request)
	GetItemsByCollectionID(w http.ResponseWriter, r *http.Request)
}

type collectionHandler struct {
	collectionService services.CollectionService
	noteService       services.ContentNoteService
	contentService    services.ContentService
	permissionService services.PermissionService
}

func NewCollectionHandler(
	collectionService services.CollectionService,
	noteService services.ContentNoteService,
	contentService services.ContentService,
	permissionService services.PermissionService,
) CollectionHandler {
	return &collectionHandler{
		collectionService: collectionService,
		noteService:       noteService,
		contentService:    contentService,
		permissionService: permissionService,
	}
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
	cmd, err := binders.BindCreateCollectionCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, cmd.UserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpBusinessError(ctx, w, "you are not allowed to create collection for this user", http.StatusForbidden)
		return
	}

	collection, err := h.collectionService.CreateCollection(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentCollection(collection)
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

	cmd, err := binders.BindDeleteCollectionCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	collection, err := h.collectionService.GetByID(ctx, cmd.CollectionID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, collection.UserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpBusinessError(ctx, w, "you are not allowed to delete this collection", http.StatusForbidden)
		return
	}

	err = h.collectionService.DeleteCollection(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	// TODO:move to cache service
	h.collectionService.ClearItemsCountCache(ctx, cmd.CollectionID)
	w.WriteHeader(http.StatusOK)
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

	cmd, err := binders.BindUpdateCollectionCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	collection, err := h.collectionService.GetByID(ctx, cmd.CollectionID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, collection.UserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpBusinessError(ctx, w, "you are not allowed to update this collection", http.StatusForbidden)
		return
	}

	collection, err = h.collectionService.UpdateCollection(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentCollection(collection)
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
// @Router /v1/users/{userId}/collections/{collectionId}/items [post]
func (h *collectionHandler) AddContentToCollection(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindAddItemToCollectionCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentNote, err := h.noteService.GetContentNoteByContentID(ctx, cmd.Category, cmd.ItemID, cmd.UserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	content := contentNote.GetContent()

	collection, err := h.collectionService.GetByID(ctx, cmd.CollectionID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, collection.UserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpBusinessError(ctx, w, "you are not allowed to add item to collection for this user", http.StatusForbidden)
		return
	}

	createdItem, err := h.collectionService.AddItemToCollection(ctx, content, contentNote, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	h.collectionService.ClearItemsCountCache(ctx, cmd.CollectionID)

	coverURL := h.contentService.GetContentCoverURL(ctx, content, cmd.CoverSize)
	contentResp := presenter.PresentContent(content, coverURL)
	res := presenter.PresentCollectionItem(createdItem, contentResp)
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

	cmd, err := binders.BindDeleteCollectionItemCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	collection, err := h.collectionService.GetByID(ctx, cmd.CollectionID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, collection.UserID, domain.ModeratorPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpBusinessError(ctx, w, "you are not allowed to remove item from this collection", http.StatusForbidden)
		return
	}

	err = h.collectionService.RemoveItemFromCollection(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
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
	userID, err := binders.BindPathVariableAsUUID(r, binders.UserIDVariable)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	collections, err := h.collectionService.GetByUserID(ctx, userID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := make([]*responses.Collection, len(collections))
	for i, collection := range collections {
		res[i] = presenter.PresentCollection(collection)
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get items by user ID
// @Description Get items by user ID
// @Tags collections
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/collections/items [get]
func (h *collectionHandler) GetItemsByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetCollectionItemsByUserIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	items, err := h.collectionService.GetItemsWithContentByUserID(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	collectionCount := 0
	groupedItems := make(map[uuid.UUID][]*responses.CollectionItem)

	var wg sync.WaitGroup
	wg.Add(len(items))

	for _, item := range items {
		if _, ok := groupedItems[item.CollectionID]; !ok {
			groupedItems[item.CollectionID] = []*responses.CollectionItem{}
			collectionCount++
		}

		content := item.Content

		go func() {
			defer wg.Done()
			coverURL := h.contentService.GetContentCoverURL(ctx, content, cmd.CoverSize)
			contentResp := presenter.PresentContent(content, coverURL)
			itemResp := presenter.PresentCollectionItem(item, contentResp)
			groupedItems[item.CollectionID] = append(groupedItems[item.CollectionID], itemResp)
		}()
	}

	wg.Wait()

	res := make([]responses.BatchCollectionItems, collectionCount)

	currentIndex := 0

	wg.Add(len(groupedItems))
	for collectionID, items := range groupedItems {
		go func() {
			defer wg.Done()
			totalElements, err := h.collectionService.CountCollectionItemsByCollectionID(ctx, collectionID)
			if err != nil {
				logger.Errorf(ctx, "failed to count collection items by collection ID: %v", err)
				return
			}

			res[currentIndex] = responses.BatchCollectionItems{
				CollectionID: collectionID,
				Paginated:    presenter.PresentPaginatedResponse(cmd.Pagination, totalElements, items),
			}
		}()
		currentIndex++
	}

	wg.Wait()

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
	collectionID, err := binders.BindPathVariableAsUUID(r, binders.CollectionIDVariable)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	collection, err := h.collectionService.GetByID(ctx, collectionID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentCollection(collection)
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

	cmd, err := binders.BindGetCollectionItemsCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var (
		group         errgroup.Group
		totalElements int64
		items         []*domain.CollectionItem
	)

	group.Go(func() error {
		totalElements, err = h.collectionService.CountCollectionItemsByCollectionID(ctx, cmd.CollectionID)
		if err != nil {
			return err
		}
		return nil
	})

	group.Go(func() error {
		items, err = h.collectionService.GetItemsWithContentByCollectionID(ctx, cmd.CollectionID, cmd.Pagination)
		if err != nil {
			return err
		}
		return nil
	})

	if err := group.Wait(); err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentSlice := make([]domain.IContent, len(items))
	for i, item := range items {
		contentSlice[i] = item.Content
	}

	coverURLs, err := h.contentService.GetContentCoverURLsAsync(ctx, contentSlice, cmd.CoverSize)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentCollectionItems(items, coverURLs)
	paginatedRes := presenter.PresentPaginatedResponse(cmd.Pagination, totalElements, res)
	utils.WriteHttpJsonResponse(ctx, w, paginatedRes)
}
