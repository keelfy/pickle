package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ProfileHandler interface {
	GetProfileById(w http.ResponseWriter, r *http.Request)
	GetProfileByLink(w http.ResponseWriter, r *http.Request)
	GetMyProfile(w http.ResponseWriter, r *http.Request)
	UpdateSettings(w http.ResponseWriter, r *http.Request)
	ValidateProfileLink(w http.ResponseWriter, r *http.Request)
	GetProfileAvatarUrl(w http.ResponseWriter, r *http.Request)
	GetMyProfileAvatarUrl(w http.ResponseWriter, r *http.Request)
	UploadAvatar(w http.ResponseWriter, r *http.Request)
	CreateProfileWebhook(w http.ResponseWriter, r *http.Request)
}

type profileHandler struct {
	profileService  services.ProfileService
	avatarService   services.AvatarService
	gameNoteService services.GameNoteService
	orderService    services.OrderService
}

func NewUserHandler(profileService services.ProfileService, avatarService services.AvatarService, gameNoteService services.GameNoteService, orderService services.OrderService) ProfileHandler {
	return &profileHandler{
		profileService:  profileService,
		avatarService:   avatarService,
		gameNoteService: gameNoteService,
		orderService:    orderService,
	}
}

// @Summary Get profile by ID
// @Description Get profile by ID
// @Tags profiles
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} types.ProfileRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId} [get]
func (h *profileHandler) GetProfileById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	profileId, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	profile, err := h.profileService.GetProfileById(ctx, profileId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.ProfileRes{}
	copier.Copy(response, profile)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Errorf(ctx, "Error encoding response: %v", err)
	}
}

// @Summary Get profile by link
// @Description Get profile by link
// @Tags profiles
// @Accept json
// @Produce json
// @Param link path string true "Link"
// @Success 200 {object} types.ProfileRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/profiles/{link} [get]
func (h *profileHandler) GetProfileByLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	link, err := utils.ReadPathVariable("link", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	profile, err := h.profileService.GetProfileByLink(ctx, link)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	var playedCount, orderedCount int64
	var playedErr, orderedErr error

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		playedCount, playedErr = h.gameNoteService.CountPlayedByUserId(ctx, profile.UserID)
	}()

	go func() {
		defer wg.Done()
		orderedCount, orderedErr = h.orderService.CountOrdersByReceiverId(ctx, profile.UserID)
	}()

	wg.Wait()

	if playedErr != nil {
		logger.Errorf(ctx, "Error occurred during played count: %v", playedErr)
	}

	if orderedErr != nil {
		logger.Errorf(ctx, "Error occurred during ordered count: %v", orderedErr)
	}

	response := &types.ProfileRes{}
	copier.Copy(response, profile)
	response.Counts = &types.CountsRes{
		Played:  playedCount,
		Watched: 0,
		Ordered: orderedCount,
	}
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get my profile
// @Description Get my profile
// @Tags profiles
// @Accept json
// @Produce json
// @Success 200 {object} types.ProfileRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me [get]
func (handler *profileHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)

	user, err := handler.profileService.GetProfileById(ctx, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.ProfileRes{}
	copier.Copy(response, user)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Update my profile
// @Description Update my profile
// @Tags profiles
// @Accept json
// @Produce json
// @Param updateProfileReq body types.UpdateProfileReq true "Update profile request"
// @Success 200 {object} types.ProfileRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me [patch]
func (handler *profileHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)

	// Read the body
	req := &types.UpdateProfileReq{}
	json.NewDecoder(r.Body).Decode(req)

	profile, err := handler.profileService.UpdateProfile(ctx, userId, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.ProfileRes{}
	copier.Copy(response, profile)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Validate profile link
// @Description Validate profile link
// @Tags profiles
// @Accept json
// @Produce json
// @Param link query string true "Link"
// @Success 200 {object} types.LinkValidationRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/profiles/validate-link [get]
func (handler *profileHandler) ValidateProfileLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	link := r.URL.Query().Get("link")
	if link == "" {
		logger.Errorf(ctx, "Link to validate is required: %v", nil)
		http.Error(w, "Invalid link", http.StatusBadRequest)
		return
	}

	response := &types.LinkValidationRes{
		Valid:   true,
		Message: "Link is available",
	}

	err := handler.profileService.ValidateLink(ctx, link)
	if err != nil {
		response.Valid = false
		response.Message = err.Error()
	}

	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary Get profile avatar URL
// @Description Get profile avatar URL
// @Tags profiles
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param size query string false "Size"
// @Success 200 {object} types.ImageRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/avatar [get]
func (handler *profileHandler) GetProfileAvatarUrl(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	size := utils.GetQueryParam(r, "size", "md")
	userId, err := utils.ReadPathUUIDVariable("userId", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	avatarUrl, err := handler.avatarService.GetAvatarUrlById(ctx, userId, size)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.ImageRes{
		URL: avatarUrl,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get my profile avatar URL
// @Description Get my profile avatar URL
// @Tags profiles
// @Accept json
// @Produce json
// @Param size query string false "Size"
// @Success 200 {object} types.ImageRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me/avatar [get]
func (handler *profileHandler) GetMyProfileAvatarUrl(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)
	size := utils.GetQueryParam(r, "size", "md")

	avatarUrl, err := handler.avatarService.GetAvatarUrlById(ctx, userId, size)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.ImageRes{
		URL: avatarUrl,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Upload avatar
// @Description Upload avatar
// @Tags profiles
// @Accept json
// @Produce json
// @Param file formData file true "File"
// @Param url formData string false "URL"
// @Success 200 {object} types.ImagePreviewRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me/avatar [post]
func (handler *profileHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)
	size := utils.GetQueryParam(r, "size", "lg")

	// Parse the form to retrieve the uploaded file
	err := r.ParseMultipartForm(config.GetMaxFileSizeBytes())
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Get the uploaded file
	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Upload the file to S3
	url, err := handler.avatarService.UploadAvatarForPreviewById(ctx, userId, file, fileHeader, size)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	res := &types.ImagePreviewRes{
		PreviewID:  uuid.Nil,
		PreviewURL: url,
	}
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Create profile webhook
// @Description Create profile webhook
// @Tags profiles
// @Accept json
// @Produce json
// @Param body body types.SupabaseWebhookPayload true "Webhook payload"
// @Success 200 {object} types.ProfileRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/supabase-webhooks/users [post]
func (handler *profileHandler) CreateProfileWebhook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Read the body
	req := &types.SupabaseWebhookPayload{}
	json.NewDecoder(r.Body).Decode(req)

	_, err := handler.profileService.CreateProfileWebhook(ctx, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
