package schedulers

import (
	"context"
	"time"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"go.uber.org/zap"
)

type IGDBScheduler interface {
	SetupIGDBSync(ctx context.Context) error
}

type igdbScheduler struct {
	igdbSyncService services.IGDBSyncService
	db              storage.RelationalStorage
	logger          *zap.SugaredLogger
}

func NewIGDBScheduler(igdbSyncService services.IGDBSyncService, db storage.RelationalStorage, zapLogger *zap.SugaredLogger) IGDBScheduler {
	return &igdbScheduler{
		igdbSyncService: igdbSyncService,
		db:              db, logger: zapLogger,
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
				if err := s.igdbSyncService.SyncGames(ctx, domain.SyncTypeIncremental); err != nil {
					s.logger.Errorf("IGDB sync failed: %v", err)
				}
			}
		}
	}()

	return nil
}
