package handlers

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/usecases"
	"github.com/pickle.pw/monolith/internal/utils"
)

type UserHandler interface {
	GetUserByID(w http.ResponseWriter, r *http.Request)
	GetMe(w http.ResponseWriter, r *http.Request)
	UpdateUser(w http.ResponseWriter, r *http.Request)
	GetUserAvatarURL(w http.ResponseWriter, r *http.Request)
	GetMyAvatarURL(w http.ResponseWriter, r *http.Request)
	UploadAvatarForMyProfile(w http.ResponseWriter, r *http.Request)
	CreateUserWebhook(w http.ResponseWriter, r *http.Request)
	ValidateUsername(w http.ResponseWriter, r *http.Request)
	AfterOryRegistrationWebhook(w http.ResponseWriter, r *http.Request)
}

type userHandler struct {
	sqlDb          storage.RelationalStorage
	userService    services.UserService
	avatarService  services.AvatarService
	ordererService services.OrdererService
	//use cases
	getUserByIDUseCase usecases.GetUserByIDUseCase
}

func NewUserHandler(
	sqlDb storage.RelationalStorage,
	userService services.UserService,
	avatarService services.AvatarService,
	getUserByIDUseCase usecases.GetUserByIDUseCase,
	ordererService services.OrdererService,
) UserHandler {
	return &userHandler{
		sqlDb:              sqlDb,
		userService:        userService,
		avatarService:      avatarService,
		getUserByIDUseCase: getUserByIDUseCase,
		ordererService:     ordererService,
	}
}

// @Summary Get profile by ID
// @Description Get profile by ID
// @Tags profiles
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId} [get]
func (h *userHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	cmd, err := binders.BindGetUserByIDCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	cmdRes, err := h.getUserByIDUseCase.Handle(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentDetailedUser(cmdRes.User, cmdRes.UserCtx, cmdRes.AvatarURL)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get my profile
// @Description Get my profile
// @Tags profiles
// @Accept json
// @Produce json
// @Param avatarSize query string false "Avatar size"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me [get]
func (h *userHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	cmd, err := binders.BindGetMeCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	cmdRes, err := h.getUserByIDUseCase.Handle(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentDetailedUser(cmdRes.User, cmdRes.UserCtx, cmdRes.AvatarURL)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Update my profile
// @Description Update my profile
// @Tags profiles
// @Accept json
// @Produce json
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me [patch]
func (h *userHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	cmd, err := binders.BindUpdateUserCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	user, err := h.userService.GetUserByID(ctx, cmd.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if user.Username != cmd.Username {
		err = h.userService.ValidateUsername(ctx, cmd.Username)
		if err != nil {
			utils.HttpError(ctx, w, err)
			return
		}
	}

	err = h.avatarService.ConfirmAvatarByUserID(ctx, user.ID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = h.sqlDb.BeginTx(ctx, func(tx sql.Queries) error {
		err = h.userService.UpdateUser(ctx, tx, user, cmd)
		if err != nil {
			return err
		}

		if user.DisplayName != cmd.DisplayName {
			err = h.ordererService.UpdateOrdererDisplayNameByUserID(ctx, tx, user.ID, cmd.DisplayName)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary Get profile avatar URL
// @Description Get profile avatar URL
// @Tags profiles
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param size query string false "Size"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/{userId}/avatar [get]
func (h *userHandler) GetUserAvatarURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetUserAvatarURLCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	avatarUrl, err := h.avatarService.GetAvatarURLByUserID(ctx, cmd.UserID, cmd.AvatarSize)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentUserAvatar(avatarUrl)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Get my profile avatar URL
// @Description Get my profile avatar URL
// @Tags profiles
// @Accept json
// @Produce json
// @Param size query string false "Size"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me/avatar [get]
func (h *userHandler) GetMyAvatarURL(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindGetMyAvatarURLCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	avatarUrl, err := h.avatarService.GetAvatarURLByUserID(ctx, cmd.UserID, cmd.AvatarSize)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentUserAvatar(avatarUrl)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Upload avatar
// @Description Upload avatar
// @Tags profiles
// @Accept json
// @Produce json
// @Param file formData file true "File"
// @Param url formData string false "URL"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/me/avatar [post]
func (h *userHandler) UploadAvatarForMyProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindUploadAvatarForPreviewCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	url, err := h.avatarService.UploadAvatarForPreviewByID(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	res := presenter.PresentUserAvatar(url)
	utils.WriteHttpJsonResponse(ctx, w, res)
}

// @Summary Create profile webhook
// @Description Create profile webhook
// @Tags profiles
// @Accept json
// @Produce json
// @Param body body types.SupabaseWebhookPayload true "Webhook payload"
// @Success 204
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/supabase-webhooks/users [post]
func (h *userHandler) CreateUserWebhook(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()

	// req := &types.SupabaseWebhookPayload{}
	// err := json.NewDecoder(r.Body).Decode(req)
	// if err != nil {
	// 	utils.HttpError(ctx, w, err)
	// 	return
	// }

	// _, err = h.userService.CreateUserWebhook(ctx, req)
	// if err != nil {
	// 	utils.HttpError(ctx, w, err)
	// 	return
	// }

	w.WriteHeader(http.StatusOK)
}

// @Summary Validate username
// @Description Validate username
// @Tags profiles
// @Accept json
// @Produce json
// @Param username query string true "Username"
// @Success 200 {object} types.UsernameValidationRes
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/users/validate-username [get]
func (h *userHandler) ValidateUsername(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	username, err := binders.BindMandatoryQueryParamAsString(r, "username")
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	response := &responses.UsernameValidation{
		Valid:   true,
		Message: "Username is available",
	}

	err = h.userService.ValidateUsername(ctx, username)
	if err != nil {
		response.Valid = false
		response.Message = err.Error()
	}

	utils.WriteHttpJsonResponse(ctx, w, response)
}

// @Summary After Ory registration webhook
// @Description After Ory registration webhook
// @Tags profiles
// @Accept json
// @Produce json
// @Param body body commands.CreateUserCommand true "Webhook payload"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/ory-webhooks/users [post]
func (h *userHandler) AfterOryRegistrationWebhook(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindAfterOryRegistrationWebhook(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if err := cmd.Validate(); err != nil {
		utils.HttpError(ctx, w, utils.NewBadRequestError("", err))
		return
	}

	_, err = h.userService.CreateUser(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
