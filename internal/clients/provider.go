package clients

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewSupabaseClient,
	NewIGDBClient,
	NewTwitchHelixClient,
)
