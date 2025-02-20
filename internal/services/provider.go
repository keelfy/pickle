package services

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewStatusService,
	NewMigrationService,
	NewProfileService,
	NewOrdererService,
	NewOrderService,
	NewContentService,
	NewContentNoteReactionService,
	NewImageService,
	NewAvatarService,
	NewPosterService,
	NewFollowerService,
	NewCollectionService,
	NewModeratorService,
	NewPermissionService,
	NewPublicProfileService,
)
