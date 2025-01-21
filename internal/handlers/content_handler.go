package handlers

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ContentHandler interface {
	SearchContent(w http.ResponseWriter, r *http.Request)
}

type contentHandler struct {
	elastic        storage.ElasticStorage
	contentService services.ContentService
}

func NewContentHandler(elastic storage.ElasticStorage, contentService services.ContentService) ContentHandler {
	return &contentHandler{
		elastic:        elastic,
		contentService: contentService,
	}
}

// @Summary Search content
// @Description Search content
// @Tags content
// @Accept json
// @Produce json
// @Param query query string true "Query"
// @Param userId query string true "User ID"
// @Success 200 {object} []types.ContentRes
// @Router /v1/users/{userId}/content/search [get]
func (h *contentHandler) SearchContent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	query, err := utils.GetRequiredQueryParam(r, "query")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	userId, err := utils.GetRequiredQueryParam(r, "userId")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	userUUID, err := utils.ParseUUIDFromString(userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	pagination, err := utils.GetPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	content, err := h.elastic.SearchContent(ctx, query, userUUID, pagination)
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
