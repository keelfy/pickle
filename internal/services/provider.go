package services

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewStatusService,
	NewMigrationsService,
	NewProfileService,
	NewOrdererService,
	NewOrderService,
	NewContentService,
	NewGameNoteService,
	NewImageService,
)
