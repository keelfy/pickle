//go:build wireinject
// +build wireinject

package main

import (
	"context"

	"github.com/google/wire"
	"github.com/pickle-pw/twitch-harbor/internal/api"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/handler"
	"github.com/pickle-pw/twitch-harbor/internal/service"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

func InitializeService(ctx context.Context) (api.TwitchHarborAPI, func(), error) {
	wire.Build(
		storage.NewRelationalStorage,
		clients.ProviderSet,
		service.ProviderSet,
		handler.ProviderSet,
		api.NewTwitchHarborAPI,
	)
	return nil, nil, nil
}
