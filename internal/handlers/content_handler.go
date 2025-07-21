package handlers

import (
	"net/http"

	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ContentHandler interface {
	SearchProfileContent(w http.ResponseWriter, r *http.Request)
	SearchContent(w http.ResponseWriter, r *http.Request)
	GetContentByID(w http.ResponseWriter, r *http.Request)
}

type contentHandler struct {
	elastic            storage.ElasticStorage
	contentNoteService services.ContentNoteService
	contentService     services.ContentService
}

func NewContentHandler(elastic storage.ElasticStorage, contentNoteService services.ContentNoteService, contentService services.ContentService) ContentHandler {
	return &contentHandler{
		elastic:            elastic,
		contentNoteService: contentNoteService,
		contentService:     contentService,
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
func (h *contentHandler) SearchProfileContent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	query, err := utils.GetRequiredQueryParam(r, "query")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	userId, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	pagination, err := utils.GetPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	content, err := h.elastic.SearchProfileContent(ctx, query, userId, pagination)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res, err := utils.ConvertElasticContentSearchResToRESTRes[types.ContentRes](content, pagination)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Search content
// @Description Search content
// @Tags content
// @Accept json
// @Produce json
// @Param query query string true "Query"
// @Param userId query string false "User ID"
// @Param category path string true "Category"
// @Param locale query string false "Locale"
// @Param page query string false "Page"
// @Param size query string false "Size"
// @Success 200 {object} []types.ContentRes
// @Router /v1/content/{category} [get]
func (h *contentHandler) SearchContent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	category, err := utils.ReadPathVariable("category", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	locale := utils.GetQueryParam(r, "locale", "en")
	query, err := utils.GetRequiredQueryParam(r, "query")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	userID, err := utils.GetQueryParamAsUUID(r, "userId")
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	pagination, err := utils.GetPagination(r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res, err := h.contentService.SearchContent(ctx, db.ContentCategory(category), query, userID, locale, pagination)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get content by ID
// @Description Get content by ID
// @Tags content
// @Accept json
// @Produce json
// @Param id path string true "Content ID"
// @Param category path string true "Category"
// @Param locale query string false "Locale"
// @Param coverSize query string false "Cover Size"
// @Router /v1/content/{category}/{id} [get]
func (h *contentHandler) GetContentByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	category, err := utils.ReadPathVariable("category", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	contentID, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	coverSize := utils.GetQueryParam(r, "coverSize", "sm")
	locale := utils.GetQueryParam(r, "locale", "en")

	content, err := h.contentService.GetLocalizedContentByID(ctx, db.ContentCategory(category), contentID, coverSize, locale)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, content)
}
