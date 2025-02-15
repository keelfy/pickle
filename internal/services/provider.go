package services

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewStatusService,
	NewMigrationService,
	NewProfileService,
	NewOrdererService,
	NewOrderService,
	NewContentService,
	NewGameNoteService,
	NewImageService,
	NewGameNoteOrderService,
	NewAvatarService,
	NewPosterService,
	NewFollowerService,
	NewGameNoteReactionService,
	NewCollectionService,
	NewModeratorService,
	NewPermissionService,
	NewPublicProfileService,
)
