package binders

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	httpreq "github.com/pickle.pw/monolith/internal/transport/http/requests"
	"github.com/pickle.pw/monolith/internal/utils"
)

func BindCreateCollectionCommand(r *http.Request) (*commands.CreateCollectionCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	req := &httpreq.CreateCollection{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, utils.NewBadRequestError("invalid request body", err)
	}

	return &commands.CreateCollectionCommand{
		UserID: userID,
		Name:   req.Name,
	}, nil
}

func BindDeleteCollectionCommand(r *http.Request) (*commands.DeleteCollectionCommand, error) {
	collectionID, err := BindPathVariableAsUUID(r, CollectionIDVariable)
	if err != nil {
		return nil, err
	}

	return &commands.DeleteCollectionCommand{
		CollectionID: collectionID,
	}, nil
}

func BindUpdateCollectionCommand(r *http.Request) (*commands.UpdateCollectionCommand, error) {
	collectionID, err := BindPathVariableAsUUID(r, CollectionIDVariable)
	if err != nil {
		return nil, err
	}

	req := &httpreq.UpdateCollection{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, utils.NewBadRequestError("invalid request body", err)
	}

	return &commands.UpdateCollectionCommand{
		CollectionID: collectionID,
		Name:         req.Name,
	}, nil
}

func BindAddItemToCollectionCommand(r *http.Request) (*commands.AddCollectionItemCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	collectionID, err := BindPathVariableAsUUID(r, CollectionIDVariable)
	if err != nil {
		return nil, err
	}

	req := &httpreq.AddItemToCollection{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, utils.NewBadRequestError("invalid request body", err)
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.AddCollectionItemCommand{
		UserID:       userID,
		CollectionID: collectionID,
		ItemID:       req.ItemID,
		Category:     domain.ContentCategory(req.Category),
		CoverSize:    domain.CoverSize(coverSize),
	}, nil
}

func BindDeleteCollectionItemCommand(r *http.Request) (*commands.DeleteCollectionItemCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	collectionID, err := BindPathVariableAsUUID(r, CollectionIDVariable)
	if err != nil {
		return nil, err
	}

	itemID, err := BindPathVariableAsUUID(r, ItemIDVariable)
	if err != nil {
		return nil, err
	}

	return &commands.DeleteCollectionItemCommand{
		UserID:       userID,
		CollectionID: collectionID,
		ItemID:       itemID,
	}, nil
}

func BindGetCollectionItemsByUserIDCommand(r *http.Request) (*commands.GetCollectionItemsByUserIDCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	pagination, err := BindPagination(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.GetCollectionItemsByUserIDCommand{
		UserID:     userID,
		CoverSize:  domain.CoverSize(coverSize),
		Pagination: pagination,
	}, nil
}

func BindGetCollectionItemsCommand(r *http.Request) (*commands.GetCollectionItemsCommand, error) {
	collectionID, err := BindPathVariableAsUUID(r, CollectionIDVariable)
	if err != nil {
		return nil, err
	}

	pagination, err := BindPagination(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.GetCollectionItemsCommand{
		CollectionID: collectionID,
		CoverSize:    domain.CoverSize(coverSize),
		Pagination:   pagination,
	}, nil
}
