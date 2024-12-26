package services

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Status struct {
	pgxpool *pgxpool.Pool
}

func NewStatusService(pgxpool *pgxpool.Pool) *Status {
	return &Status{pgxpool: pgxpool}
}

func (service *Status) GetApiStatus() error {
	return nil
}

func (service *Status) GetDatabaseStatus(ctx context.Context) error {
	err := service.pgxpool.Ping(ctx)
	if err != nil {
		return err
	}
	return nil
}
