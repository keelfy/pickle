package schedulers

import (
	"context"
	"time"

	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
)

type IGDBScheduler interface {
	SetupIGDBSync(ctx context.Context) error
}

type igdbScheduler struct {
	igdbSyncService services.IGDBSyncService
	db              storage.RelationalStorage
}

func NewIGDBScheduler(igdbSyncService services.IGDBSyncService, db storage.RelationalStorage) IGDBScheduler {
	return &igdbScheduler{
		igdbSyncService: igdbSyncService,
		db:              db,
	}
}

func (s *igdbScheduler) SetupIGDBSync(ctx context.Context) error {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				if err := s.igdbSyncService.SyncGames(ctx); err != nil {
					logger.Errorf(ctx, "IGDB sync failed: %v", err)
				}
			}
		}
	}()

	return nil
}
