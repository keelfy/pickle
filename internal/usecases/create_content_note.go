package usecases

import (
	"context"
	"sync"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type CreateContentNoteUseCase interface {
	Handle(ctx context.Context, cmd commands.ICreateContentNoteCommand) (*commands.CreateContentNoteCommandResult, error)
}

type createContentNoteUseCase struct {
	sqlDB              storage.RelationalStorage
	contentNoteService services.ContentNoteService
	permissionService  services.PermissionService
	userService        services.UserService
	ordererService     services.OrdererService
	contentService     services.ContentService
	avatarService      services.AvatarService
}

func NewCreateContentNoteUseCase(
	sqlDB storage.RelationalStorage,
	contentNoteService services.ContentNoteService,
	permissionService services.PermissionService,
	userService services.UserService,
	ordererService services.OrdererService,
	contentService services.ContentService,
	avatarService services.AvatarService,
) CreateContentNoteUseCase {
	return &createContentNoteUseCase{
		sqlDB:              sqlDB,
		contentNoteService: contentNoteService,
		permissionService:  permissionService,
		userService:        userService,
		ordererService:     ordererService,
		contentService:     contentService,
		avatarService:      avatarService,
	}
}

func (uc *createContentNoteUseCase) Handle(ctx context.Context, cmd commands.ICreateContentNoteCommand) (*commands.CreateContentNoteCommandResult, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	hasPermission, err := uc.permissionService.HasPermission(ctx, cmd.GetUserID(), authUserID, domain.ModeratorPermission)
	if err != nil {
		return nil, err
	}

	if !hasPermission {
		return nil, utils.NewForbiddenError("you are not allowed to create a content note for this user", nil)
	}

	alreadyExists, err := uc.contentNoteService.CheckIfContentNoteExistsByContentID(ctx, cmd.GetContentID(), cmd.GetCategory())
	if err != nil {
		return nil, err
	}

	if alreadyExists {
		return nil, utils.NewConflictError("note with this content already exists", nil)
	}

	authUser, err := uc.userService.GetUserByID(ctx, authUserID)
	if err != nil {
		return nil, err
	}

	ordererCmd := cmd.GetOrderer()

	// Update display name to user's current display name if it's internal orderer
	if cmd.GetOrderer().Source == domain.OrdererSourceInternal {
		ordererCmd = &commands.CreateOrdererCommand{
			UserID:          &authUserID,
			Source:          domain.OrdererSourceInternal,
			DisplayName:     authUser.DisplayName,
			ReferenceUserID: nil,
		}
	}

	initialOrderer, err := uc.ordererService.CreateOrderer(ctx, uc.sqlDB.Queries(), ordererCmd)
	if err != nil {
		return nil, err
	}

	content, err := uc.contentService.GetDetailedContentByID(ctx, cmd.GetCategory(), cmd.GetContentID())
	if err != nil {
		return nil, err
	}

	detailedContentNote, err := uc.contentNoteService.CreateContentNote(ctx, uc.sqlDB.Queries(), content, initialOrderer, cmd)
	if err != nil {
		return nil, err
	}

	var (
		wg                      sync.WaitGroup
		initialOrdererAvatarURL string
		coverURL                *string
	)

	wg.Add(1)
	go func() {
		initialOrdererAvatarURL, err = uc.avatarService.GetAvatarURLByUserID(ctx, *initialOrderer.UserID, cmd.GetInitialOrdererAvatarSize())
		if err != nil {
			logger.Errorf(ctx, "failed to get initial orderer avatar url: %v", err)
		}
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		coverURL = uc.contentService.GetContentCoverURL(ctx, content, cmd.GetCoverSize())
		wg.Done()
	}()

	wg.Wait()

	return &commands.CreateContentNoteCommandResult{
		DetailedContentNote:     detailedContentNote,
		InitialOrderer:          initialOrderer,
		InitialOrdererUser:      authUser.User,
		InitialOrdererAvatarURL: initialOrdererAvatarURL,
		CoverURL:                coverURL,
		IsNoted:                 true,
	}, nil
}
