package handlers

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type Content struct {
	contentService *services.Content
}

func NewContentHandler(contentService *services.Content) *Content {
	return &Content{
		contentService: contentService,
	}
}

func (h *Content) SearchContent(w http.ResponseWriter, r *http.Request) {
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

	utils.WriteHttpJsonResponse(w, res)
}
