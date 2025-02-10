package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type CollectionHandler interface {
	CreateCollection(w http.ResponseWriter, r *http.Request)
	DeleteCollection(w http.ResponseWriter, r *http.Request)
	AddItemToCollection(w http.ResponseWriter, r *http.Request)
	RemoveItemFromCollection(w http.ResponseWriter, r *http.Request)
	GetCollectionsByUserID(w http.ResponseWriter, r *http.Request)
	GetItemsByUserID(w http.ResponseWriter, r *http.Request)
}

type collectionHandler struct {
	collectionService services.CollectionService
}

func NewCollectionHandler(collectionService services.CollectionService) CollectionHandler {
	return &collectionHandler{collectionService: collectionService}
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
func (h *collectionHandler) DeleteCollection(w http.ResponseWriter, r *http.Request) {
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

	collection, err := h.collectionService.AddItemToCollection(ctx, collectionID, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.CollectionItemRes{}
	copier.Copy(res, collection)
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

	items, err := h.collectionService.GetItemsByUserID(ctx, userID)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := make([]*types.CollectionItemRes, len(items))
	copier.Copy(&res, &items)
	utils.WriteHttpJsonResponse(ctx, w, res)
}
