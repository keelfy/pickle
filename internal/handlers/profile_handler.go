package handlers

import (
	"encoding/json"
	"net/http"

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
	userService   services.ProfileService
	avatarService services.AvatarService
}

func NewUserHandler(userService services.ProfileService, avatarService services.AvatarService) ProfileHandler {
	return &profileHandler{
		userService:   userService,
		avatarService: avatarService,
	}
}

// Returns the profile of the user with the given id
func (h *profileHandler) GetProfileById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	user, err := h.userService.GetProfileById(ctx, id)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.ProfileRes{}
	copier.Copy(response, user)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Errorf(ctx, "Error encoding response: %v", err)
	}
}

// Returns the profile of the user with the given id
func (h *profileHandler) GetProfileByLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	link, err := utils.ReadPathVariable("link", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	user, err := h.userService.GetProfileByLink(ctx, link)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.ProfileRes{}
	copier.Copy(response, user)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.Errorf(ctx, "Error encoding response: %v", err)
	}
}

// Returns the profile of the user who is currently logged in
func (handler *profileHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)

	user, err := handler.userService.GetProfileById(ctx, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.ProfileRes{}
	copier.Copy(response, user)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

// Updates the profile of the user who is currently logged in
func (handler *profileHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)

	// Read the body
	req := &types.UpdateProfileReq{}
	json.NewDecoder(r.Body).Decode(req)

	profile, err := handler.userService.UpdateProfile(ctx, userId, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	response := &types.ProfileRes{}
	copier.Copy(response, profile)
	utils.WriteHttpJsonResponse(ctx, w, response)
}

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

	err := handler.userService.ValidateLink(ctx, link)
	if err != nil {
		response.Valid = false
		response.Message = err.Error()
	}

	utils.WriteHttpJsonResponse(ctx, w, response)
}

func (handler *profileHandler) GetProfileAvatarUrl(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	size := utils.GetQueryParam(r, "size", "md")
	userId, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	avatarUrl, err := handler.avatarService.GetAvatarUrlById(ctx, userId, size)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, struct {
		URL *string `json:"url"`
	}{
		URL: avatarUrl,
	})
}

func (handler *profileHandler) GetMyProfileAvatarUrl(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)
	size := utils.GetQueryParam(r, "size", "md")

	avatarUrl, err := handler.avatarService.GetAvatarUrlById(ctx, userId, size)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	utils.WriteHttpJsonResponse(ctx, w, struct {
		URL *string `json:"url"`
	}{
		URL: avatarUrl,
	})
}

// Uploads the avatar of the user who is currently logged in from the request
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

	utils.WriteHttpJsonResponse(ctx, w, struct {
		PreviewURL string `json:"previewUrl"`
	}{
		PreviewURL: url,
	})
}

func (handler *profileHandler) CreateProfileWebhook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Read the body
	req := &types.SupabaseWebhookPayload{}
	json.NewDecoder(r.Body).Decode(req)

	_, err := handler.userService.CreateProfileWebhook(ctx, req)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
