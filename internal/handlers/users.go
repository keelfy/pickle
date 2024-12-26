package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type User struct {
	userService *services.User
}

func NewUserHandler(userService *services.User) *User {
	return &User{
		userService: userService,
	}
}

// Returns the profile of the user with the given id
func (h *User) GetProfileById(w http.ResponseWriter, r *http.Request) {
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
		log.Printf("Error encoding response: %v", err)
	}
}

// Returns the profile of the user with the given id
func (h *User) GetProfileByLink(w http.ResponseWriter, r *http.Request) {
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
		log.Printf("Error encoding response: %v", err)
	}
}

// Returns the profile of the user who is currently logged in
func (handler *User) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)

	user, err := handler.userService.GetProfileById(ctx, userId)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.ProfileRes{}
	copier.Copy(response, user)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// Updates the profile of the user who is currently logged in
func (handler *User) UpdateSettings(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	response := &types.ProfileRes{}
	copier.Copy(response, profile)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

func (handler *User) ValidateProfileLink(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	link := r.URL.Query().Get("link")
	if link == "" {
		log.Printf("Link to validate is required: %v", nil)
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

	w.Header().Add(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// Uploads the avatar of the user who is currently logged in from the request
func (handler *User) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userId := utils.UserIdFromContext(ctx)

	// Parse the form to retrieve the uploaded file
	err := r.ParseMultipartForm(10 << 20) // 10 MB max memory
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
	url, err := handler.userService.UploadAvatar(r.Context(), userId, file, fileHeader)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	// Respond with the uploaded file URL
	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	_, err = w.Write([]byte(fmt.Sprintf(`{"url": "%s"}`, url)))
	if err != nil {
		log.Printf("Error writing response: %v", err)
	}
}

func (handler *User) CreateProfileWebhook(w http.ResponseWriter, r *http.Request) {
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
