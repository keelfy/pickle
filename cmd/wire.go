//go:build wireinject
// +build wireinject

package main

import (
	"context"

	"github.com/google/wire"
	"github.com/pickle.pw/monolith/internal/api"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
)

func InitializeAPI(ctx context.Context) (api.PickleAPI, func(), error) {
	wire.Build(
		storage.NewPGXPoolWithCleanup,
		storage.NewSupabaseClient,
		storage.NewElasticClient,
		storage.NewS3Client,
		storage.NewCacheClient,
		services.ProviderSet,
		handlers.ProviderSet,
		api.NewPickleAPI,
	)
	return nil, nil, nil
}
