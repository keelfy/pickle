package binders

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
)

func BindGetContentByIDCommand(r *http.Request) (*commands.GetContentByIDCommand, error) {
	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	contentID, err := BindPathVariableAsUUID(r, ContentIDVariable)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.GetContentByIDCommand{
		ID:        contentID,
		Category:  category,
		CoverSize: domain.CoverSize(coverSize),
	}, nil
}

func BindSearchContentCommand(r *http.Request) (*commands.SearchContentCommand, error) {
	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	query, err := BindMandatoryQueryParamAsString(r, "query")
	if err != nil {
		return nil, err
	}

	userID, err := BindOptionalQueryParamAsUUID(r, "user_id")
	if err != nil {
		return nil, err
	}

	pagination, err := BindPagination(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.SearchContentCommand{
		Category:   category,
		Query:      query,
		UserID:     userID,
		Pagination: pagination,
		CoverSize:  domain.CoverSize(coverSize),
	}, nil
}

func BindSearchUserContentCommand(r *http.Request) (*commands.SearchUserContentCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	query, err := BindMandatoryQueryParamAsString(r, "query")
	if err != nil {
		return nil, err
	}

	pagination, err := BindPagination(r)
	if err != nil {
		return nil, err
	}

	coverSize := BindOptionalQueryParamAsString(r, CoverSizeParam, string(domain.CoverSizeMedium))
	return &commands.SearchUserContentCommand{
		UserID:     userID,
		Query:      query,
		Pagination: pagination,
		CoverSize:  domain.CoverSize(coverSize),
	}, nil
}
