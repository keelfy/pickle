package schedulers

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	NewIGDBScheduler,
	NewTMDBScheduler,
)
