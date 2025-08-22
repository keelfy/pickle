package storage

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage/sql"
)

type RelationalStorage interface {
	Queries() sql.Queries
	BeginTx(ctx context.Context, fn func(sql.Queries) error) error
	Ping(ctx context.Context) error
}

type relationalStorage struct {
	conn    *pgxpool.Pool
	queries sql.Queries
}

func NewRelationalStorage(ctx context.Context) (RelationalStorage, func(), error) {
	logger.Infof(ctx, "%v PostgreSQL %v", strings.Repeat("~", 12), strings.Repeat("~", 13))
	pool, err := pgxpool.New(ctx, config.GetDatabaseURL())
	if err != nil {
		return nil, nil, err
	}

	sqlDatabase := &relationalStorage{
		conn:    pool,
		queries: sql.New(pool),
	}

	logger.Infof(ctx, "Connection pool created")

	cleanup := func() {
		pool.Close()
	}
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return sqlDatabase, cleanup, nil
}

func (s *relationalStorage) Queries() sql.Queries {
	return s.queries
}

func (s *relationalStorage) BeginTx(ctx context.Context, fn func(sql.Queries) error) error {
	tx, err := s.conn.Begin(ctx)
	if err != nil {
		logger.Errorf(ctx, "failed to begin transaction: %v", err)
		return err
	}

	q := sql.WithTx(tx)

	err = fn(q)
	if err != nil {
		err1 := tx.Rollback(ctx)
		if err1 != nil {
			logger.Errorf(ctx, "failed to rollback transaction: %v", err1)
		}
		return err
	}

	err = tx.Commit(ctx)
	if err != nil {
		logger.Errorf(ctx, "failed to commit transaction: %v", err)
		return err
	}

	return nil
}

func (sqlDb *relationalStorage) Ping(ctx context.Context) error {
	err := sqlDb.conn.Ping(ctx)
	if err != nil {
		logger.Debugf(ctx, "[SQL] Error pinging PostgreSQL: %v", err)
		return err
	}
	return nil
}
