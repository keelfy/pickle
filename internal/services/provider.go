package services

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewMigrationService,
	NewOrdererService,
	NewOrderService,
	NewContentNoteService,
	NewContentNoteReactionService,
	NewImageService,
	NewAvatarService,
	NewPosterService,
	NewFollowerService,
	NewCollectionService,
	NewModeratorService,
	NewPermissionService,
	NewProfileService,
	NewUserService,
	NewIGDBSyncService,
	NewTMDBSyncService,
	NewKratosService,
	NewOrdersBrokerService,
	NewContentService,
)
