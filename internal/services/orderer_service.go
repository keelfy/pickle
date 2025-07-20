package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type OrdererService interface {
	GetOrdererById(ctx context.Context, id uuid.UUID) (*db.Orderer, error)
	CreateReferencedOrdererIfNotExists(ctx context.Context, qtx *db.Queries, initiator *db.Profile, displayName, source, referenceUserID string) (*db.Orderer, error)
	CreateOrdererManuallyIfNotExists(ctx context.Context, qtx *db.Queries, initiator *db.Profile, displayName, source string) (*db.Orderer, error)
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

func (service *ordererService) CreateReferencedOrdererIfNotExists(ctx context.Context, qtx *db.Queries, initiator *db.Profile, displayName, source, referenceUserID string) (*db.Orderer, error) {
	var initiatorUUID *uuid.UUID
	if initiator != nil {
		initiatorUUID = &initiator.UserID
	}

	orderer, err := qtx.FindOrdererBySourceAndReferenceUserID(ctx, db.FindOrdererBySourceAndReferenceUserIDParams{
		Source:          source,
		ReferenceUserID: referenceUserID,
	})
	if err != nil && err != pgx.ErrNoRows {
		return nil, err
	}
	if orderer != nil {
		return orderer, nil
	}

	orderer, err = qtx.InsertReferencedOrderer(ctx, db.InsertReferencedOrdererParams{
		CreatedBy:       initiatorUUID,
		UpdatedBy:       initiatorUUID,
		DisplayName:     displayName,
		UserID:          initiatorUUID,
		Source:          source,
		ReferenceUserID: &referenceUserID,
	})
	if err != nil {
		return nil, err
	}
	return orderer, nil
}

func (service *ordererService) CreateOrdererManuallyIfNotExists(ctx context.Context, qtx *db.Queries, initiator *db.Profile, displayName, source string) (*db.Orderer, error) {
	var initiatorUUID *uuid.UUID
	if initiator != nil {
		initiatorUUID = &initiator.UserID
	}

	orderer, err := qtx.FindOrdererByUserID(ctx, *initiatorUUID)
	if err != nil && err != pgx.ErrNoRows {
		return nil, err
	}

	if orderer != nil {
		return orderer, nil
	}

	orderer, err = qtx.InsertOrdererManually(ctx, db.InsertOrdererManuallyParams{
		CreatedBy:       initiatorUUID,
		UpdatedBy:       initiatorUUID,
		DisplayName:     displayName,
		UserID:          initiatorUUID,
		Source:          source,
		ReferenceUserID: nil,
	})
	if err != nil {
		return nil, err
	}
	return orderer, nil
}

func (service *ordererService) UpdateOrdererUsernameByUserIDWithTx(ctx context.Context, qtx *db.Queries, profile *db.Profile) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during user ID extraction", err)
	}

	err = qtx.UpdateOrdererByUserID(ctx, db.UpdateOrdererByUserIDParams{
		UserID:      profile.UserID,
		UpdatedBy:   authUserID,
		DisplayName: profile.DisplayName,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred during orderer update", err)
	}

	return nil
}
