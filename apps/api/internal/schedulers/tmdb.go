package schedulers

import (
	"context"
	"time"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"go.uber.org/zap"
)

type TMDBScheduler interface {
	SetupTMDBSync(ctx context.Context) error
}

type tmdbScheduler struct {
	tmdbSyncService services.TMDBSyncService
	db              storage.RelationalStorage
	logger          *zap.SugaredLogger
}

func NewTMDBScheduler(tmdbSyncService services.TMDBSyncService, db storage.RelationalStorage, zapLogger *zap.SugaredLogger) TMDBScheduler {
	return &tmdbScheduler{
		tmdbSyncService: tmdbSyncService,
		db:              db, logger: zapLogger,
	}
}

func (s *tmdbScheduler) SetupTMDBSync(ctx context.Context) error {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				if err := s.tmdbSyncService.SyncMovies(ctx, domain.SyncTypeIncremental); err != nil {
					s.logger.Errorf("TMDB sync failed: %v", err)
				}
			}
		}
	}()

	return nil
}
