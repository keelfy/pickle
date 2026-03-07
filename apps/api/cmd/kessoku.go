//go:generate go tool kessoku $GOFILE

package main

import (
	"github.com/mazrean/kessoku"
	"github.com/pickle.pw/monolith/internal/api"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/schedulers"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/usecases"
)

// type AppBuilder func(ctx context.Context) (api.PickleAPI, func(), error)

var _ = kessoku.Inject[api.PickleAPI](
	"InitializeAPI",
	kessoku.Provide(logger.NewLogger),
	kessoku.Provide(storage.NewRelationalStorage),
	kessoku.Provide(storage.NewElasticStorage),
	kessoku.Provide(storage.NewFileStorage),
	kessoku.Provide(storage.NewCacheStorage),
	clientsSet,
	servicesSet,
	handlersSet,
	schedulersSet,
	usecasesSet,
	kessoku.Provide(api.NewPickleAPI),
)

var clientsSet = kessoku.Set(
	kessoku.Provide(clients.NewOryAPI),
	kessoku.Provide(clients.NewIGDBClient),
	kessoku.Provide(clients.NewTMDBClient),
)

var servicesSet = kessoku.Set(
	kessoku.Provide(services.NewMigrationService),
	kessoku.Provide(services.NewOrdererService),
	kessoku.Provide(services.NewOrderService),
	kessoku.Provide(services.NewContentNoteService),
	kessoku.Provide(services.NewContentNoteReactionService),
	kessoku.Provide(services.NewImageService),
	kessoku.Provide(services.NewAvatarService),
	kessoku.Provide(services.NewPosterService),
	kessoku.Provide(services.NewFollowerService),
	kessoku.Provide(services.NewCollectionService),
	kessoku.Provide(services.NewModeratorService),
	kessoku.Provide(services.NewPermissionService),
	kessoku.Provide(services.NewProfileService),
	kessoku.Provide(services.NewUserService),
	kessoku.Provide(services.NewIGDBSyncService),
	kessoku.Provide(services.NewTMDBSyncService),
	kessoku.Provide(services.NewKratosService),
	kessoku.Provide(services.NewOrdersBrokerService),
	kessoku.Provide(services.NewContentService),
)

var handlersSet = kessoku.Set(
	kessoku.Provide(handlers.NewStatusHandler),
	kessoku.Provide(handlers.NewUserHandler),
	kessoku.Provide(handlers.NewProfileHandler),
	kessoku.Provide(handlers.NewOrdersHandler),
	kessoku.Provide(handlers.NewContentNoteHandler),
	kessoku.Provide(handlers.NewContentHandler),
	kessoku.Provide(handlers.NewPosterHandler),
	kessoku.Provide(handlers.NewCollectionHandler),
	kessoku.Provide(handlers.NewModeratorHandler),
	kessoku.Provide(handlers.NewProfileEventsHandler),
	kessoku.Provide(handlers.NewFollowerHandler),
)

var schedulersSet = kessoku.Set(
	kessoku.Provide(schedulers.NewIGDBScheduler),
	kessoku.Provide(schedulers.NewTMDBScheduler),
)

var usecasesSet = kessoku.Set(
	kessoku.Provide(usecases.NewCreateContentNoteUseCase),
	kessoku.Provide(usecases.NewCreateOrderUseCase),
	kessoku.Provide(usecases.NewGetUserByIDUseCase),
	kessoku.Provide(usecases.NewGetSortedContentNotesByUserIDUseCase),
)
