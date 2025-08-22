package handlers

import (
	"net/http"
	"sync"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/binders"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type ModeratorHandler interface {
	AddModeratorByUsername(w http.ResponseWriter, r *http.Request)
	DeleteModeratorByUserIDAndModeratorID(w http.ResponseWriter, r *http.Request)
	GetModeratorsByUserID(w http.ResponseWriter, r *http.Request)
}

type moderatorHandler struct {
	moderatorService  services.ModeratorService
	userService       services.UserService
	avatarService     services.AvatarService
	permissionService services.PermissionService
}

func NewModeratorHandler(
	moderatorService services.ModeratorService,
	userService services.UserService,
	avatarService services.AvatarService,
	permissionService services.PermissionService,
) ModeratorHandler {
	return &moderatorHandler{
		moderatorService:  moderatorService,
		userService:       userService,
		avatarService:     avatarService,
		permissionService: permissionService,
	}
}

func (h *moderatorHandler) AddModeratorByUsername(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindAddModeratorCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	err = cmd.Validate()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, cmd.UserID, domain.OnlyOwnerPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpError(ctx, w, utils.NewForbiddenError("Only the profile owner can add a moderator", nil))
		return
	}

	user, err := h.userService.GetUserByID(ctx, cmd.UserID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var group errgroup.Group
	var moderator *domain.ModeratorUser
	var avatarURL string

	group.Go(func() error {
		moderator, err = h.moderatorService.AddModeratorByUsername(ctx, user, cmd)
		return err
	})

	group.Go(func() error {
		url, err := h.avatarService.GetAvatarURLByUserID(ctx, moderator.ModeratorID, cmd.AvatarSize)
		if err != nil {
			logger.Errorf(ctx, "failed to get avatar URL by user ID: %v", err)
		}
		avatarURL = url
		return nil
	})

	err = group.Wait()
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	h.moderatorService.ClearModeratorsCache(ctx, user.GetID())

	presenter := presenter.PresentModerator(moderator, avatarURL)
	utils.WriteHttpJsonResponse(ctx, w, presenter)
}

func (h *moderatorHandler) DeleteModeratorByUserIDAndModeratorID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	cmd, err := binders.BindDeleteModeratorCommand(r)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, cmd.UserID, domain.OnlyOwnerPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpError(ctx, w, utils.NewForbiddenError("Only the profile owner can delete a moderator", nil))
		return
	}

	err = h.moderatorService.DeleteModerator(ctx, cmd)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	h.moderatorService.ClearModeratorsCache(ctx, cmd.UserID)
	w.WriteHeader(http.StatusOK)
}

func (h *moderatorHandler) GetModeratorsByUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID, err := binders.BindPathVariableAsUUID(r, binders.UserIDVariable)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	avatarSize := binders.BindOptionalQueryParamAsString(r, binders.AvatarSizeParam, string(domain.AvatarSizeSmall))

	hasPermission, err := h.permissionService.IsAuthorizedUserHasPermission(ctx, userID, domain.OnlyOwnerPermission)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	if !hasPermission {
		utils.HttpBusinessError(ctx, w, "You are not allowed to get moderators of this profile", http.StatusForbidden)
		return
	}

	moderators, err := h.moderatorService.GetModeratorsByUserID(ctx, userID)
	if err != nil {
		utils.HttpError(ctx, w, err)
		return
	}

	var group sync.WaitGroup
	moderatorProfiles := make([]*resp.Moderator, len(moderators))

	group.Add(len(moderators))
	for i, moderator := range moderators {
		go func(i int, moderator *domain.ModeratorUser) {
			defer group.Done()
			avatarUrl, err := h.avatarService.GetAvatarURLByUserID(ctx, moderator.ModeratorID, domain.AvatarSize(avatarSize))
			if err != nil {
				logger.Errorf(ctx, "failed to get avatar URL by user ID: %v", err)
			}
			moderatorProfiles[i] = presenter.PresentModerator(moderator, avatarUrl)
		}(i, moderator)
	}

	group.Wait()

	utils.WriteHttpJsonResponse(ctx, w, moderatorProfiles)
}
