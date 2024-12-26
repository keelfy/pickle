package storage

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pickle.pw/monolith/config"
)

func InitPGXPool() *pgxpool.Pool {
	pool, err := pgxpool.New(context.Background(), config.GetDatabaseURL())
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	return pool
}
