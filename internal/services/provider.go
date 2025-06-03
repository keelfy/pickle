package services

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
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
	NewIGDBSyncService,
)
