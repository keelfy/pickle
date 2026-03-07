package binders

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	httpreq "github.com/pickle.pw/monolith/internal/transport/http/requests"
	"github.com/pickle.pw/monolith/internal/utils"
)

func BindCreateContentNoteReq(r *http.Request, category domain.ContentCategory) (httpreq.ICreateContentNoteReq, error) {
	var req httpreq.ICreateContentNoteReq

	switch category {
	case domain.ContentCategoryGames:
		req = &httpreq.CreateGameNoteReq{}
	case domain.ContentCategoryMovies:
		req = &httpreq.CreateMovieNoteReq{}
	default:
		return nil, utils.NewBadRequestError("invalid content type", nil)
	}

	err := json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		return nil, utils.NewBadRequestError("failed to decode request body", err)
	}

	return req, nil
}

func BindPathVariableAsContentVariable(r *http.Request) (domain.ContentCategory, error) {
	value := r.PathValue(CategoryVariable)
	if len(value) == 0 {
		return "", utils.NewBadRequestError("path variable category is required", nil)
	}
	return domain.ContentCategory(value), nil
}

func BindGetContentNoteByIDCommand(r *http.Request) (*commands.GetContentNoteByIDCommand, error) {
	contentNoteId, err := BindPathVariableAsUUID(r, ContentNoteIDVariable)
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	initialOrdererAvatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeSmall))
	return &commands.GetContentNoteByIDCommand{
		ID:                       contentNoteId,
		Category:                 category,
		CoverSize:                domain.CoverSize(coverSize),
		InitialOrdererAvatarSize: domain.AvatarSize(initialOrdererAvatarSize),
	}, nil
}

func BindCreateContentNoteCommand(r *http.Request) (commands.ICreateContentNoteCommand, error) {
	receiverID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))

	req, err := BindCreateContentNoteReq(r, category)
	if err != nil {
		return nil, err
	}

	ordererCommand := &commands.CreateOrdererCommand{
		Source: domain.OrdererSourceInternal,
	}

	initialOrdererAvatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeSmall))
	baseCommand := &commands.CreateContentNoteCommand{
		UserID:                   receiverID,
		Category:                 category,
		ContentID:                req.GetContentID(),
		Status:                   req.GetStatus(),
		Rate:                     req.GetRate(),
		Comment:                  req.GetComment(),
		CoverSize:                domain.CoverSize(coverSize),
		Orderer:                  ordererCommand,
		InitialOrdererAvatarSize: domain.AvatarSize(initialOrdererAvatarSize),
	}

	switch req := req.(type) {
	case *httpreq.CreateGameNoteReq:
		return &commands.CreateGameNoteCommand{
			CreateContentNoteCommand: baseCommand,
			LastPlayedAt:             req.LastPlayedAt,
		}, nil
	case *httpreq.CreateMovieNoteReq:
		return &commands.CreateMovieNoteCommand{
			CreateContentNoteCommand: baseCommand,
			WatchedAt:                req.WatchedAt,
		}, nil
	default:
		return nil, errors.New("invalid content type")
	}
}

func BindUpdateContentNoteCommand(r *http.Request) (commands.IUpdateContentNoteCommand, error) {
	contentNoteId, err := BindPathVariableAsUUID(r, ContentNoteIDVariable)
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))

	req, err := BindCreateContentNoteReq(r, category)
	if err != nil {
		return nil, err
	}

	baseCommand := &commands.UpdateContentNoteCommand{
		ID:        contentNoteId,
		Category:  category,
		Status:    req.GetStatus(),
		Rate:      req.GetRate(),
		Comment:   req.GetComment(),
		CoverSize: domain.CoverSize(coverSize),
	}

	switch req := req.(type) {
	case *httpreq.CreateGameNoteReq:
		return &commands.GameNoteUpdateCommand{
			UpdateContentNoteCommand: baseCommand,
			LastPlayedAt:             req.LastPlayedAt,
		}, nil
	case *httpreq.CreateMovieNoteReq:
		return &commands.MovieNoteUpdateCommand{
			UpdateContentNoteCommand: baseCommand,
			WatchedAt:                req.WatchedAt,
		}, nil
	default:
		return nil, errors.New("invalid content type")
	}
}

func BindGetSortedContentNotesByUserIDCommand(r *http.Request) (*commands.GetSortedContentNotesByUserIDCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	sort, err := BindPaginatedCursorSort(r)
	if err != nil {
		return nil, err
	}

	filters, err := BindFilters(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	initialOrdererAvatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeSmall))

	cmd := &commands.GetSortedContentNotesByUserIDCommand{
		UserID:                   userID,
		Category:                 category,
		Sort:                     sort,
		Filters:                  filters,
		CoverSize:                domain.CoverSize(coverSize),
		InitialOrdererAvatarSize: domain.AvatarSize(initialOrdererAvatarSize),
	}

	return cmd, nil
}

func BindDeleteContentNoteCommand(r *http.Request) (*commands.DeleteContentNoteCommand, error) {
	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	id, err := BindPathVariableAsUUID(r, ContentNoteIDVariable)
	if err != nil {
		return nil, err
	}

	resetApprovedOrders := BindOptionalQueryParamAsString(r, "resetApprovedOrders", "false")
	return &commands.DeleteContentNoteCommand{
		ID:                  id,
		Category:            category,
		ResetApprovedOrders: resetApprovedOrders == "true",
	}, nil
}

func BindGetOrdersByContentNoteIDCommand(r *http.Request) (*commands.GetOrdersByContentNoteIDCommand, error) {
	contentNoteId, err := BindPathVariableAsUUID(r, ContentNoteIDVariable)
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	pagination, err := BindPagination(r)
	if err != nil {
		return nil, err
	}

	ordererAvatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeSmall))

	return &commands.GetOrdersByContentNoteIDCommand{
		ID:                contentNoteId,
		Category:          category,
		Pagination:        pagination,
		OrdererAvatarSize: domain.AvatarSize(ordererAvatarSize),
	}, nil
}
