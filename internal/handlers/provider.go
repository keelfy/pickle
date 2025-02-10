package handlers

import (
	"github.com/google/wire"
)

var ProviderSet = wire.NewSet(
	NewStatusHandler,
	NewUserHandler,
	NewOrdersHandler,
	NewGameNoteHandler,
	NewContentHandler,
	NewPosterHandler,
	NewCollectionHandler,
)
