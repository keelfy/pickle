package storage

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
)

type RelationalStorage interface {
	Queries() *db.Queries
	Begin(ctx context.Context) (pgx.Tx, error)
	Ping(ctx context.Context) error
}

type relationalStorage struct {
	conn    *pgxpool.Pool
	queries *db.Queries
}

func NewRelationalStorage(ctx context.Context) (RelationalStorage, func(), error) {
	logger.Infof(ctx, "%v PostgreSQL %v", strings.Repeat("~", 12), strings.Repeat("~", 13))
	pool, err := pgxpool.New(ctx, config.GetDatabaseURL())
	if err != nil {
		return nil, nil, err
	}

	queries := db.New(pool)
	sqlDatabase := &relationalStorage{
		conn:    pool,
		queries: queries,
	}

	logger.Infof(ctx, "Connection pool created")

	cleanup := func() {
		pool.Close()
	}
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return sqlDatabase, cleanup, nil
}

func (s *relationalStorage) Queries() *db.Queries {
	return s.queries
}

func (s *relationalStorage) Begin(ctx context.Context) (pgx.Tx, error) {
	return s.conn.Begin(ctx)
}

func (sqlDb *relationalStorage) Ping(ctx context.Context) error {
	err := sqlDb.conn.Ping(ctx)
	if err != nil {
		logger.Debugf(ctx, "[SQL] Error pinging PostgreSQL: %v", err)
		return err
	}
	return nil
}
