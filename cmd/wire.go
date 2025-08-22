//go:build wireinject
// +build wireinject

package main

import (
	"context"

	"github.com/google/wire"
	"github.com/pickle.pw/monolith/internal/api"
	"github.com/pickle.pw/monolith/internal/clients"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/schedulers"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/usecases"
)

func InitializeAPI(ctx context.Context) (api.PickleAPI, func(), error) {
	wire.Build(
		storage.NewRelationalStorage,
		storage.NewElasticStorage,
		storage.NewFileStorage,
		storage.NewCacheStorage,
		clients.ProviderSet,
		schedulers.ProviderSet,
		services.ProviderSet,
		handlers.ProviderSet,
		usecases.ProviderSet,
		api.NewPickleAPI,
	)
	return nil, nil, nil
}
