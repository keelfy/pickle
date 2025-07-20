package service

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewTwitchEventService,
	NewEventsubService,
	NewTwitchAuthService,
	NewTwitchWSService,
	NewBroadcasterService,
	NewTwitchRewardService,
	NewOrderService,
)
