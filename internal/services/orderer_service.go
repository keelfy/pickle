package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
)

type OrdererService interface {
	GetOrdererById(ctx context.Context, id uuid.UUID) (*db.Orderer, error)
	CreateOrderer(ctx context.Context, username string, creator *db.Profile) (*db.Orderer, error)
}

type ordererService struct {
	sqlDb storage.RelationalStorage
}

func NewOrdererService(sqlDb storage.RelationalStorage) OrdererService {
	return &ordererService{
		sqlDb: sqlDb,
	}
}

func (service *ordererService) GetOrdererById(ctx context.Context, id uuid.UUID) (*db.Orderer, error) {
	orderer, err := service.sqlDb.Queries().FindOrdererById(ctx, id)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orderer fetching", err)
	}
	return orderer, nil
}

func (service *ordererService) CreateOrderer(ctx context.Context, username string, creator *db.Profile) (*db.Orderer, error) {
	var creatorUuid *uuid.UUID
	if creator != nil {
		creatorUuid = &creator.UserID
	}

	orderer, err := service.sqlDb.Queries().InsertOrderer(ctx, db.InsertOrdererParams{
		CreatedBy: creatorUuid,
		UpdatedBy: creatorUuid,
		Username:  username,
		UserID:    nil,
		Anonymous: true,
	})
	if err != nil {
		return nil, err
	}
	return orderer, nil
}
