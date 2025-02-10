package services

import (
	"context"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
)

type CollectionService interface {
	CreateCollection(ctx context.Context, userID uuid.UUID, req *types.CreateCollectionReq) (*db.Collection, error)
	DeleteCollection(ctx context.Context, collectionID uuid.UUID) error
	AddItemToCollection(ctx context.Context, collectionID uuid.UUID, req *types.AddItemToCollectionReq) (*db.CollectionItem, error)
	RemoveItemFromCollection(ctx context.Context, collectionID uuid.UUID, itemID uuid.UUID) error
	GetByID(ctx context.Context, collectionID uuid.UUID) (*db.Collection, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*db.Collection, error)
	GetItemByID(ctx context.Context, itemID uuid.UUID) (*db.CollectionItem, error)
	GetItemsByUserID(ctx context.Context, userID uuid.UUID) ([]*db.CollectionItem, error)
}

type collectionService struct {
	sqlDB storage.RelationalStorage
}

func NewCollectionService(sqlDB storage.RelationalStorage) CollectionService {
	return &collectionService{sqlDB: sqlDB}
}

func (service *collectionService) CreateCollection(ctx context.Context, userID uuid.UUID, req *types.CreateCollectionReq) (*db.Collection, error) {
	if err := req.Validate(); err != nil {
		return nil, errors.NewBadRequestError("invalid request", err)
	}

	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get user ID from context", err)
	}

	if userID != authUserID {
		return nil, errors.NewForbiddenError("you are not allowed to create collection for this user", nil)
	}

	collection, err := service.sqlDB.Queries().InsertCollection(ctx, db.InsertCollectionParams{
		CreatedBy: authUserID,
		UpdatedBy: authUserID,
		Name:      req.Name,
		UserID:    userID,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to create collection", err)
	}

	return collection, nil
}

func (service *collectionService) DeleteCollection(ctx context.Context, collectionID uuid.UUID) error {
	collection, err := service.GetByID(ctx, collectionID)
	if err != nil {
		return err
	}

	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to get user ID from context", err)
	}

	if collection.UserID != authUserID {
		return errors.NewForbiddenError("you are not allowed to delete this collection", nil)
	}

	err = service.sqlDB.Queries().DeleteCollectionByID(ctx, collectionID)
	if err != nil {
		return errors.NewInternalServerError("failed to delete collection", err)
	}

	return nil
}

func (service *collectionService) AddItemToCollection(ctx context.Context, collectionID uuid.UUID, req *types.AddItemToCollectionReq) (*db.CollectionItem, error) {
	if err := req.Validate(); err != nil {
		return nil, errors.NewBadRequestError("invalid request", err)
	}

	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get user ID from context", err)
	}

	collection, err := service.GetByID(ctx, collectionID)
	if err != nil {
		return nil, err
	}

	if collection.UserID != authUserID {
		return nil, errors.NewForbiddenError("you are not allowed to add item to collection for this user", nil)
	}

	collectionItem, err := service.sqlDB.Queries().InsertCollectionItem(ctx, db.InsertCollectionItemParams{
		CreatedBy:    authUserID,
		CollectionID: collectionID,
		NoteID:       req.NoteID,
		Category:     req.Category,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to add item to collection", err)
	}

	return collectionItem, nil
}

func (service *collectionService) RemoveItemFromCollection(ctx context.Context, collectionID uuid.UUID, itemID uuid.UUID) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to get user ID from context", err)
	}

	var (
		group          errgroup.Group
		collection     *db.Collection
		collectionItem *db.CollectionItem
	)

	group.Go(func() error {
		collectionItem, err = service.GetItemByID(ctx, itemID)
		if err != nil {
			return err
		}
		return nil
	})

	group.Go(func() error {
		collection, err = service.GetByID(ctx, collectionItem.CollectionID)
		if err != nil {
			return err
		}
		return nil
	})

	err = group.Wait()
	if err != nil {
		return err
	}

	if collection.UserID != authUserID {
		return errors.NewForbiddenError("you are not allowed to remove item from this collection", nil)
	}

	err = service.sqlDB.Queries().DeleteCollectionItemByID(ctx, itemID)
	if err != nil {
		return errors.NewInternalServerError("failed to remove item from collection", err)
	}
	return nil
}

func (service *collectionService) GetByID(ctx context.Context, collectionID uuid.UUID) (*db.Collection, error) {
	collection, err := service.sqlDB.Queries().FindCollectionByID(ctx, collectionID)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get collection by ID", err)
	}

	return collection, nil
}

func (service *collectionService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*db.Collection, error) {
	collections, err := service.sqlDB.Queries().FindCollectionsByUserID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get collections by user ID", err)
	}

	return collections, nil
}

func (service *collectionService) GetItemByID(ctx context.Context, itemID uuid.UUID) (*db.CollectionItem, error) {
	collectionItem, err := service.sqlDB.Queries().FindCollectionItemByID(ctx, itemID)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get item by ID", err)
	}

	return collectionItem, nil
}

func (service *collectionService) GetItemsByUserID(ctx context.Context, userID uuid.UUID) ([]*db.CollectionItem, error) {
	collectionItems, err := service.sqlDB.Queries().FindCollectionItemsByUserID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get items by user ID", err)
	}

	return collectionItems, nil
}
