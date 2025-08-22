package schedulers

import (
	"context"
	"time"

	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
)

type TMDBScheduler interface {
	SetupTMDBSync(ctx context.Context) error
}

type tmdbScheduler struct {
	tmdbSyncService services.TMDBSyncService
	db              storage.RelationalStorage
}

func NewTMDBScheduler(tmdbSyncService services.TMDBSyncService, db storage.RelationalStorage) TMDBScheduler {
	return &tmdbScheduler{
		tmdbSyncService: tmdbSyncService,
		db:              db,
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
					logger.Errorf(ctx, "TMDB sync failed: %v", err)
				}
			}
		}
	}()

	return nil
}
