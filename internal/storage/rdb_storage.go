package storage

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"go.uber.org/zap"
)

type RelationalStorage interface {
	Queries() sql.Queries
	BeginTx(ctx context.Context, fn func(sql.Queries) error) error
	Ping(ctx context.Context) error
}

type relationalStorage struct {
	conn    *pgxpool.Pool
	queries sql.Queries
	logger  *zap.SugaredLogger
}

func NewRelationalStorage(ctx context.Context, zapLogger *zap.SugaredLogger) (RelationalStorage, func(), error) {
	pool, err := pgxpool.New(ctx, config.GetDatabaseURL())
	if err != nil {
		return nil, nil, err
	}

	sqlDatabase := &relationalStorage{
		conn:    pool,
		queries: sql.New(pool),
		logger:  zapLogger,
	}

	cleanup := func() {
		pool.Close()
	}
	return sqlDatabase, cleanup, nil
}

func (s *relationalStorage) Queries() sql.Queries {
	return s.queries
}

func (s *relationalStorage) BeginTx(ctx context.Context, fn func(sql.Queries) error) error {
	tx, err := s.conn.Begin(ctx)
	if err != nil {
		s.logger.Errorf("failed to begin transaction: %v", err)
		return err
	}

	q := sql.WithTx(tx)

	err = fn(q)
	if err != nil {
		err1 := tx.Rollback(ctx)
		if err1 != nil {
			s.logger.Errorf("failed to rollback transaction: %v", err1)
		}
		return err
	}

	err = tx.Commit(ctx)
	if err != nil {
		s.logger.Errorf("failed to commit transaction: %v", err)
		return err
	}

	return nil
}

func (sqlDb *relationalStorage) Ping(ctx context.Context) error {
	err := sqlDb.conn.Ping(ctx)
	if err != nil {
		sqlDb.logger.Debugf("[SQL] Error pinging PostgreSQL: %v", err)
		return err
	}
	return nil
}
