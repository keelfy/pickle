//go:generate go tool kessoku $GOFILE

package main

import (
	"github.com/mazrean/kessoku"
	"github.com/pickle-pw/twitch-harbor/internal/api"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/handler"
	"github.com/pickle-pw/twitch-harbor/internal/service"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

// type AppBuilder func(ctx context.Context) (api.PickleAPI, func(), error)

var _ = kessoku.Inject[api.TwitchHarborAPI](
	"InitializeService",
	kessoku.Provide(storage.NewRelationalStorage),
	clientsSet,
	servicesSet,
	handlersSet,
	kessoku.Provide(api.NewTwitchHarborAPI),
)

var clientsSet = kessoku.Set(
	kessoku.Provide(clients.NewTwitchHelixClient),
	kessoku.Provide(clients.NewOryAPI),
)

var servicesSet = kessoku.Set(
	kessoku.Provide(service.NewTwitchWSService),
	kessoku.Provide(service.NewTwitchAuthService),
	kessoku.Provide(service.NewTwitchEventService),
	kessoku.Provide(service.NewEventsubService),
	kessoku.Provide(service.NewBroadcasterService),
	kessoku.Provide(service.NewTwitchRewardService),
	kessoku.Provide(service.NewOrderService),
)

var handlersSet = kessoku.Set(
	kessoku.Provide(handler.NewWebhookHandler),
	kessoku.Provide(handler.NewBroadcasterHandler),
)
