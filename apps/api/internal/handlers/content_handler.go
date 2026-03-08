package handlers

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
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
	logger             *zap.SugaredLogger
}

func NewContentHandler(
	elastic storage.ElasticStorage,
	contentNoteService services.ContentNoteService,
	contentService services.ContentService, zapLogger *zap.SugaredLogger,
) ContentHandler {
	return &contentHandler{
		elastic:            elastic,
		contentNoteService: contentNoteService,
		contentService:     contentService, logger: zapLogger,
	}
}

// @Summary Search content
// @Description Search content
// @Tags content
// @Accept json
// @Produce json
// @Param query query string true "Query"
// @Param userId query string true "User ID"
// @Success 200 {object} []responses.UserContent
// @Failure 400
// @Failure 500
// @Router /v1/users/{userId}/content/search [get]
func (h *contentHandler) SearchProfileContent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindSearchUserContentCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	content, err := h.contentService.SearchUserContent(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentSlice := make([]domain.IContent, len(content.Content))
	for i, c := range content.Content {
		contentSlice[i] = c.Source.ContentBase
	}

	coverURLs, err := h.contentService.GetContentCoverURLsAsync(ctx, contentSlice, cmd.CoverSize)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	presented := make([]*responses.UserContent, len(content.Content))
	for i, c := range content.Content {
		presented[i] = presenter.PresentUserContent(c.Source, coverURLs[c.Source.GetID()])
	}

	paginatedRes := presenter.PresentPaginatedResponse(cmd.Pagination, content.TotalElements, presented)
	utils.WriteHttpJsonResponse(ctx, w, paginatedRes)
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
// @Success 200 {object} responses.Paginated[responses.IContent]
// @Failure 400
// @Failure 500
// @Router /v1/content/{category} [get]
func (h *contentHandler) SearchContent(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindSearchContentCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res, err := h.contentService.SearchContent(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	contentSlice := make([]domain.IContent, len(res.Content))
	for i, c := range res.Content {
		contentSlice[i] = c.Source
	}

	coverURLs, err := h.contentService.GetContentCoverURLsAsync(ctx, contentSlice, cmd.CoverSize)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	presented := make([]responses.IContent, len(res.Content))
	for i, c := range res.Content {
		presented[i] = presenter.PresentContent(c.Source, coverURLs[c.Source.GetID()])
	}

	paginatedRes := presenter.PresentPaginatedResponse(cmd.Pagination, res.TotalElements, presented)
	utils.WriteHttpJsonResponse(ctx, w, paginatedRes)
}

// @Summary Get content by ID
// @Description Get content by ID
// @Tags content
// @Accept json
// @Produce json
// @Param id path string true "Content ID"
// @Param category path string true "Category"
// @Param coverSize query string false "Cover Size"
// @Success 200 {object} responses.DetailedContent
// @Failure 400
// @Failure 500
// @Router /v1/content/{category}/{contentId} [get]
func (h *contentHandler) GetContentByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetContentByIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	content, err := h.contentService.GetDetailedContentByID(ctx, cmd.Category, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	coverURL := h.contentService.GetContentCoverURL(ctx, content, cmd.CoverSize)
	presented := presenter.PresentDetailedContent(content, coverURL)
	utils.WriteHttpJsonResponse(ctx, w, presented)
}
