package usecases

import (
	"context"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type GetUserByIDUseCase interface {
	Handle(ctx context.Context, cmd *commands.GetUserByIDCommand) (*commands.GetUserByIDCommandResult, error)
}

type getUserByIDUseCase struct {
	userService    services.UserService
	avatarService  services.AvatarService
	profileService services.ProfileService
}

func NewGetUserByIDUseCase(
	userService services.UserService,
	avatarService services.AvatarService,
	profileService services.ProfileService,
) GetUserByIDUseCase {
	return &getUserByIDUseCase{
		userService:    userService,
		avatarService:  avatarService,
		profileService: profileService,
	}
}

func (uc *getUserByIDUseCase) Handle(ctx context.Context, cmd *commands.GetUserByIDCommand) (*commands.GetUserByIDCommandResult, error) {
	var (
		user      *domain.DetailedUser
		avatarURL string
		userCtx   *domain.UserContext
		wg        errgroup.Group
	)

	wg.Go(func() error {
		u, err := uc.userService.GetUserByID(ctx, cmd.ID)
		if err != nil {
			logger.Errorf(ctx, "failed to get user by ID: %v", err)
		}
		user = u
		return err
	})

	wg.Go(func() error {
		url, err := uc.avatarService.GetAvatarURLByUserID(ctx, cmd.ID, cmd.AvatarSize)
		if err != nil {
			logger.Errorf(ctx, "failed to get avatar URL by user ID: %v", err)
		}
		avatarURL = url
		return nil
	})

	wg.Go(func() error {
		context, err := uc.profileService.GetProfileContext(ctx, cmd.ID)
		if err != nil {
			logger.Errorf(ctx, "failed to get profile context: %v", err)
		}
		userCtx = context
		return nil
	})

	err := wg.Wait()
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get user by ID", err)
	}

	return &commands.GetUserByIDCommandResult{
		User:      user,
		AvatarURL: avatarURL,
		UserCtx:   userCtx,
	}, nil
}
