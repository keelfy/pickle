package handlers

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ContentHandler interface {
	SearchContent(w http.ResponseWriter, r *http.Request)
}

type contentHandler struct {
	contentService services.ContentService
}

func NewContentHandler(contentService services.ContentService) ContentHandler {
	return &contentHandler{
		contentService: contentService,
	}
}

func (h *contentHandler) SearchContent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	query, err := utils.GetRequiredQueryParam(r, "query")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	profileId, err := utils.GetRequiredQueryParam(r, "profileId")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	profileUuid, err := utils.ParseUUIDFromString(profileId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	pagination, err := utils.GetPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Business logic of content search
	content, err := h.contentService.SearchContent(ctx, query, profileUuid, pagination)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res, err := utils.ConvertElasticSearchResponseToRESTResponse[types.ContentRes](content, pagination)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, res)
}
