package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type PosterHandler interface {
	UploadPosterPreview(w http.ResponseWriter, r *http.Request)
	GetPosterPreviews(w http.ResponseWriter, r *http.Request)
	GetPosterPreviewImageURL(w http.ResponseWriter, r *http.Request)
	DeletePosterPreview(w http.ResponseWriter, r *http.Request)
}

type posterHandler struct {
	posterService services.PosterService
}

func NewPosterHandler(posterService services.PosterService) PosterHandler {
	return &posterHandler{
		posterService: posterService,
	}
}

// @Summary Upload a poster preview
// @Description Upload a poster preview
// @Tags posters
// @Accept json
// @Produce json
// @Param file formData file true "File"
// @Param url formData string false "URL"
// @Param userId path string true "User ID"
// @Success 200 {object} types.ImagePreviewRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/posters/previews [post]
func (h *posterHandler) UploadPosterPreview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	size := utils.GetQueryParam(r, "size", "sm")
	userId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Parse the form to retrieve the uploaded file
	err = r.ParseMultipartForm(config.GetMaxFileSizeBytes())
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	var (
		previewId  uuid.UUID
		previewUrl string
	)

	embeddedUrl := r.FormValue("url")
	if embeddedUrl != "" {
		// Embed the poster from the URL
		previewId, previewUrl, err = h.posterService.EmbedPosterForPreview(ctx, userId, size, embeddedUrl)
		if err != nil {
			utils.HttpError(ctx, err, w)
			return
		}
	} else {
		// Get the uploaded file
		file, fileHeader, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "File is required", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// Upload the file to S3
		previewId, previewUrl, err = h.posterService.UploadPosterForPreview(ctx, userId, size, file, fileHeader)
		if err != nil {
			utils.HttpError(ctx, err, w)
			return
		}
	}

	res := &types.ImagePreviewRes{
		PreviewID:  previewId,
		PreviewURL: previewUrl,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get a poster preview
// @Description Get a poster preview
// @Tags posters
// @Accept json
// @Produce json
// @Param previewId path string true "Preview ID"
// @Success 200 {object} types.PosterPreviewRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/posters/previews/{previewId} [get]
func (h *posterHandler) GetPosterPreview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	previewId, err := utils.ReadPathUUIDVariable("previewId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	preview, err := h.posterService.GetPosterPreviewByID(ctx, previewId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.PosterPreviewRes{
		ID:        preview.ID,
		CreatedAt: preview.CreatedAt,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get all poster previews
// @Description Get all poster previews
// @Tags posters
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param size query string false "Size" default(lg)
// @Success 200 {object} []types.PosterPreviewRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/posters/previews [get]
func (h *posterHandler) GetPosterPreviews(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	size := utils.GetQueryParam(r, "size", "lg")

	previews, err := h.posterService.GetPosterPreviews(ctx, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := make([]*types.PosterPreviewRes, len(previews))
	for i, preview := range previews {
		imageURL, err := h.posterService.GetPosterImageURL(ctx, "preview", size, preview.ObjectKey, &preview.CreatedAt)
		if err != nil {
			logger.Errorf(ctx, "Error occurred getting poster preview image URL: %v", err)
			continue
		}

		res[i] = &types.PosterPreviewRes{
			ID:        preview.ID,
			CreatedAt: preview.CreatedAt,
			URL:       imageURL,
		}
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get a poster preview image URL
// @Description Get a poster preview image URL
// @Tags posters
// @Accept json
// @Produce json
// @Param previewId path string true "Preview ID"
// @Param size query string false "Size"
// @Success 200 {object} types.ImageRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/posters/previews/{previewId}/image [get]
func (h *posterHandler) GetPosterPreviewImageURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	previewId, err := utils.ReadPathUUIDVariable("previewId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	size := utils.GetQueryParam(r, "size", "lg")

	imageURL, err := h.posterService.GetPosterPreviewImageURL(ctx, previewId, size)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.ImageRes{
		URL: imageURL,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Delete a poster preview
// @Description Delete a poster preview
// @Tags posters
// @Accept json
// @Produce json
// @Param previewId path string true "Preview ID"
// @Success 200 {object} string
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/posters/previews/{previewId} [delete]
func (h *posterHandler) DeletePosterPreview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	previewId, err := utils.ReadPathUUIDVariable("previewId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	err = h.posterService.DeletePosterPreview(ctx, previewId, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
}
