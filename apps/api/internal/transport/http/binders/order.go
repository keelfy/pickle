package binders

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/transport/http/requests"
	"github.com/pickle.pw/monolith/internal/utils"
)

func BindGetOrderByIDCommand(r *http.Request) (*commands.GetOrderByIDCommand, error) {
	id, err := BindPathVariableAsUUID(r, OrderIDVariable)
	if err != nil {
		return nil, err
	}
	return &commands.GetOrderByIDCommand{
		ID: id,
	}, nil
}

func BindGetSortedOrdersByUserIDCommand(r *http.Request) (*commands.GetSortedOrdersByUserIDCommand, error) {
	userId, err := BindPathVariableAsUUID(r, UserIDVariable)
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

	avatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeSmall))
	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.GetSortedOrdersByUserIDCommand{
		UserID:     userId,
		Sort:       sort,
		Filters:    filters,
		AvatarSize: domain.AvatarSize(avatarSize),
		CoverSize:  domain.CoverSize(coverSize),
	}, nil
}

func BindPickleSuggestionOrderCommand(r *http.Request) (*commands.CreateOrderCommand, *commands.CreateOrdererCommand, error) {
	authUserID, err := utils.GetUserIDFromCtx(r.Context())
	if err != nil {
		return nil, nil, err
	}

	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, nil, err
	}

	req := &requests.PickleSuggestionOrder{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, nil, err
	}

	ordererCmd := &commands.CreateOrdererCommand{
		UserID: &authUserID,
		Source: domain.OrdererSourceInternal,
	}

	cmd := &commands.CreateOrderCommand{
		ReceiverID:     userID,
		IsAnonymously:  req.IsAnonymously,
		Category:       domain.ContentCategory(req.Category),
		Message:        req.Message,
		Source:         domain.OrderSourceSuggestion,
		IdempotencyKey: "",
	}
	return cmd, ordererCmd, nil
}

func BindWebhookCreateOrderCommand(r *http.Request) (*commands.CreateOrderCommand, *commands.CreateOrdererCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, nil, err
	}

	req := &requests.CreateOrder{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, nil, err
	}

	ordererSource := domain.OrdererSourceInternal
	switch req.Source {
	case string(domain.OrderSourceTwitchChannelPoints):
		ordererSource = domain.OrdererSourceTwitch
	}

	ordererCmd := &commands.CreateOrdererCommand{
		UserID:          nil,
		DisplayName:     req.OrdererUsername,
		Source:          ordererSource,
		ReferenceUserID: req.ReferenceUserID,
	}

	cmd := &commands.CreateOrderCommand{
		ReceiverID:     userID,
		IsAnonymously:  req.IsAnonymously,
		Category:       domain.ContentCategory(req.Category),
		Message:        req.Message,
		Source:         domain.OrderSource(req.Source),
		Reference:      req.Reference,
		IdempotencyKey: req.IdempotencyKey,
	}
	return cmd, ordererCmd, nil
}

func BindApproveOrderCommand(r *http.Request) (*commands.ApproveOrderCommand, error) {
	receiverID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	orderID, err := BindPathVariableAsUUID(r, OrderIDVariable)
	if err != nil {
		return nil, err
	}

	req := &requests.ApproveOrder{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, err
	}

	avatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeMedium))
	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.ApproveOrderCommand{
		ReceiverID:      receiverID,
		ID:              orderID,
		ContentID:       req.ContentID,
		ContentCategory: domain.ContentCategory(req.Category),
		CoverSize:       domain.CoverSize(coverSize),
		AvatarSize:      domain.AvatarSize(avatarSize),
	}, nil
}

func BindRejectOrderCommand(r *http.Request) (*commands.RejectOrderCommand, error) {
	receiverID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	orderID, err := BindPathVariableAsUUID(r, OrderIDVariable)
	if err != nil {
		return nil, err
	}

	avatarSize := BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeMedium))
	return &commands.RejectOrderCommand{
		ID:         orderID,
		ReceiverID: receiverID,
		AvatarSize: domain.AvatarSize(avatarSize),
	}, nil
}
