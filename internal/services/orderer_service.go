package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type OrdererService interface {
	GetOrdererById(ctx context.Context, id uuid.UUID) (*db.Orderer, error)
	CreateOrderer(ctx context.Context, username string, creator *db.Profile, isAnonymous bool) (*db.Orderer, error)
	CreateOrdererWithTx(ctx context.Context, qtx *db.Queries, username string, creator *db.Profile, isAnonymous bool) (*db.Orderer, error)
	UpdateOrdererUsernameByUserIDWithTx(ctx context.Context, qtx *db.Queries, profile *db.Profile) error
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
	orderer, err := service.sqlDb.Queries().FindOrdererByID(ctx, id)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during orderer fetching", err)
	}
	return orderer, nil
}

func (service *ordererService) CreateOrderer(ctx context.Context, username string, creator *db.Profile, isAnonymous bool) (*db.Orderer, error) {
	return service.CreateOrdererWithTx(ctx, service.sqlDb.Queries(), username, creator, isAnonymous)
}

func (service *ordererService) CreateOrdererWithTx(ctx context.Context, qtx *db.Queries, username string, creator *db.Profile, isAnonymous bool) (*db.Orderer, error) {
	var creatorUuid *uuid.UUID
	if creator != nil {
		creatorUuid = &creator.UserID
	}

	orderer, err := qtx.InsertOrderer(ctx, db.InsertOrdererParams{
		CreatedBy: creatorUuid,
		UpdatedBy: creatorUuid,
		Username:  username,
		UserID:    creatorUuid,
		Anonymous: isAnonymous,
	})
	if err != nil {
		return nil, err
	}
	return orderer, nil
}

func (service *ordererService) UpdateOrdererUsernameByUserIDWithTx(ctx context.Context, qtx *db.Queries, profile *db.Profile) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during user ID extraction", err)
	}

	err = qtx.UpdateOrdererByUserID(ctx, db.UpdateOrdererByUserIDParams{
		UserID:    &profile.UserID,
		UpdatedBy: &authUserID,
		Username:  profile.Username,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred during orderer update", err)
	}

	return nil
}
