//go:build wireinject
// +build wireinject

package main

import (
	"context"

	"github.com/google/wire"
	"github.com/pickle.pw/monolith/cmd/api"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
)

func InitializePickle(ctx context.Context) (*api.Pickle, func(), error) {
	wire.Build(
		storage.NewPGXPoolWithCleanup,
		storage.InitSupabase,
		storage.InitElasticsearchClient,
		storage.InitS3Client,
		services.ProviderSet,
		handlers.ProviderSet,
		api.NewPickle,
	)
	return &api.Pickle{}, nil, nil
}
