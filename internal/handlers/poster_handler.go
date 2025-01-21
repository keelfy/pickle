package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type PosterHandler interface {
	UploadPoster(w http.ResponseWriter, r *http.Request)
}

type posterHandler struct {
	posterService services.PosterService
}

func NewPosterHandler(posterService services.PosterService) PosterHandler {
	return &posterHandler{
		posterService: posterService,
	}
}

// @Summary Upload a poster
// @Description Upload a poster
// @Tags posters
// @Accept json
// @Produce json
// @Param file formData file true "File"
// @Param url formData string false "URL"
// @Param userId path string true "User ID"
// @Success 200 {object} types.ImagePreviewRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/posters [post]
func (h *posterHandler) UploadPoster(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)
	size := utils.GetQueryParam(r, "size", "sm")

	// Parse the form to retrieve the uploaded file
	err := r.ParseMultipartForm(config.GetMaxFileSizeBytes())
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
