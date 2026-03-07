package services

import (
	"github.com/mazrean/kessoku"
)

var ProviderSet = kessoku.Set(
	kessoku.Provide(NewMigrationService),
	kessoku.Provide(NewOrdererService),
	kessoku.Provide(NewOrderService),
	kessoku.Provide(NewContentNoteService),
	kessoku.Provide(NewContentNoteReactionService),
	kessoku.Provide(NewImageService),
	kessoku.Provide(NewAvatarService),
	kessoku.Provide(NewPosterService),
	kessoku.Provide(NewFollowerService),
	kessoku.Provide(NewCollectionService),
	kessoku.Provide(NewModeratorService),
	kessoku.Provide(NewPermissionService),
	kessoku.Provide(NewProfileService),
	kessoku.Provide(NewUserService),
	kessoku.Provide(NewIGDBSyncService),
	kessoku.Provide(NewTMDBSyncService),
	kessoku.Provide(NewKratosService),
	kessoku.Provide(NewOrdersBrokerService),
	kessoku.Provide(NewContentService),
)
