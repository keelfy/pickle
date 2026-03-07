package clients

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewTwitchHelixClient,
	NewOryAPI,
)
