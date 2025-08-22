package usecases

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewCreateContentNoteUseCase,
	NewCreateOrderUseCase,
	NewGetUserByIDUseCase,
	NewGetSortedContentNotesByUserIDUseCase,
)
