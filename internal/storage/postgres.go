package storage

import (
	"context"
	"log"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pickle.pw/monolith/config"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type SQLDatabase struct {
	Conn    *pgxpool.Pool
	Queries *db.Queries
}

func NewPGXPoolWithCleanup(ctx context.Context) (*SQLDatabase, func(), error) {
	log.Printf("%v PostgreSQL %v\n", strings.Repeat("~", 12), strings.Repeat("~", 13))
	pool, err := pgxpool.New(ctx, config.GetDatabaseURL())
	if err != nil {
		return nil, nil, err
	}

	queries := db.New(pool)
	sqlDatabase := &SQLDatabase{
		Conn:    pool,
		Queries: queries,
	}

	log.Println("Connection pool created")

	cleanup := func() {
		pool.Close()
	}
	log.Println(strings.Repeat("~", 37))
	return sqlDatabase, cleanup, nil
}
