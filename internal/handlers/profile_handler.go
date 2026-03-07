package handlers

import (
	"net/http"
	"sync"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type ProfileHandler interface {
	GetProfileByUsername(w http.ResponseWriter, r *http.Request)
}

type profileHandler struct {
	userService     services.UserService
	profileService  services.ProfileService
	avatarService   services.AvatarService
	orderService    services.OrderService
	followerService services.FollowerService
	logger          *zap.SugaredLogger
}

func NewProfileHandler(
	userService services.UserService,
	profileService services.ProfileService,
	avatarService services.AvatarService,
	orderService services.OrderService,
	followerService services.FollowerService, zapLogger *zap.SugaredLogger,
) ProfileHandler {
	return &profileHandler{
		userService:     userService,
		profileService:  profileService,
		avatarService:   avatarService,
		orderService:    orderService,
		followerService: followerService, logger: zapLogger,
	}
}

// @Summary Get profile by username
// @Description Get profile by username
// @Tags profiles
// @Accept json
// @Produce json
// @Param username path string true "Username"
// @Param avatarSize query string false "Avatar size"
// @Success 200
// @Failure 400 {object} string
// @Failure 500 {object} string
// @Router /v1/profiles/{username} [get]
func (h *profileHandler) GetProfileByUsername(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	username, err := binders.BindPathVariable(r, binders.UsernameVariable)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	user, err := h.userService.GetDetailedUserByUsername(ctx, username)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	avatarSize := domain.AvatarSize(binders.BindOptionalQueryParamAsString(r, binders.AvatarSizeParam, string(domain.AvatarSizeMedium)))

	var wg sync.WaitGroup
	counts := &domain.ProfileCounts{}
	avatarURL := ""
	profileCtx := &domain.UserContext{}
	var (
		countsErr     error
		avatarURLErr  error
		profileCtxErr error
	)

	wg.Add(1)
	go func() {
		defer wg.Done()
		counts, countsErr = h.profileService.GetProfileCounts(ctx, user.ID)
		if countsErr != nil {
			utils.HttpError(ctx, w, countsErr)
			return
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		avatarURL, avatarURLErr = h.avatarService.GetAvatarURLByUserID(ctx, user.ID, avatarSize)
		if avatarURLErr != nil {
			utils.HttpError(ctx, w, avatarURLErr)
			return
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		profileCtx, profileCtxErr = h.profileService.GetProfileContext(ctx, user.ID)
		if profileCtxErr != nil {
			utils.HttpError(ctx, w, profileCtxErr)
			return
		}
	}()

	wg.Wait()

	presented := presenter.PresentProfile(user, profileCtx, counts, avatarURL)
	utils.WriteHttpJsonResponse(ctx, w, presented)
}
