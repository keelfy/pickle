package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"
)

type CollectionService interface {
	CreateCollection(ctx context.Context, userID uuid.UUID, req *types.CreateCollectionReq) (*db.Collection, error)
	DeleteCollection(ctx context.Context, collectionID uuid.UUID) error
	UpdateCollection(ctx context.Context, collectionID uuid.UUID, req *types.UpdateCollectionReq) (*db.Collection, error)
	AddItemToCollection(ctx context.Context, collectionID uuid.UUID, content models.ContentNote) (*db.CollectionItem, error)
	RemoveItemFromCollection(ctx context.Context, collectionID uuid.UUID, itemID uuid.UUID) error
	GetByID(ctx context.Context, collectionID uuid.UUID) (*db.Collection, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*db.Collection, error)
	GetItemByID(ctx context.Context, itemID uuid.UUID) (*db.CollectionItem, error)
	GetItemsByCollectionID(ctx context.Context, collectionID uuid.UUID, pagination *types.Pagination, locale string) ([]*db.FindCollectionItemsByCollectionIDWithContentRow, error)
	GetItemsByUserID(ctx context.Context, userID uuid.UUID, pagination *types.Pagination, locale string) ([]*db.FindCollectionItemsByUserIDWithContentLimitPerCollectionRow, error)
	CountCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) (int64, error)
}

type collectionService struct {
	sqlDB             storage.RelationalStorage
	cache             storage.CacheStorage
	singleflightGroup singleflight.Group
	permissionService PermissionService
}

func NewCollectionService(sqlDB storage.RelationalStorage, cache storage.CacheStorage, permissionService PermissionService) CollectionService {
	return &collectionService{
		sqlDB:             sqlDB,
		cache:             cache,
		singleflightGroup: singleflight.Group{},
		permissionService: permissionService,
	}
}

func (service *collectionService) CreateCollection(ctx context.Context, userID uuid.UUID, req *types.CreateCollectionReq) (*db.Collection, error) {
	if err := req.Validate(); err != nil {
		return nil, errors.NewBadRequestError("invalid request", err)
	}

	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get user ID from context", err)
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, userID, authUserID, types.ModeratorPermission)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to check permission", err)
	}

	if !hasPermission {
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

	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to get user ID from context", err)
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, collection.UserID, authUserID, types.ModeratorPermission)
	if err != nil {
		return errors.NewInternalServerError("failed to check permission", err)
	}

	if !hasPermission {
		return errors.NewForbiddenError("you are not allowed to delete this collection", nil)
	}

	tx, err := service.sqlDB.Begin(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to begin transaction", err)
	}
	defer tx.Rollback(ctx)
	qtx := service.sqlDB.Queries().WithTx(tx)

	err = qtx.DeleteCollectionItemsByCollectionID(ctx, collectionID)
	if err != nil {
		return errors.NewInternalServerError("failed to delete collection items", err)
	}

	err = qtx.DeleteCollectionByID(ctx, collectionID)
	if err != nil {
		return errors.NewInternalServerError("failed to delete collection", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to commit transaction", err)
	}

	service.clearItemsCountCache(ctx, collectionID)
	return nil
}

func (service *collectionService) UpdateCollection(ctx context.Context, collectionID uuid.UUID, req *types.UpdateCollectionReq) (*db.Collection, error) {
	collection, err := service.GetByID(ctx, collectionID)
	if err != nil {
		return nil, err
	}

	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get user ID from context", err)
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, collection.UserID, authUserID, types.ModeratorPermission)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to check permission", err)
	}

	if !hasPermission {
		return nil, errors.NewForbiddenError("you are not allowed to update this collection", nil)
	}

	newName := collection.Name
	if req.Name != nil {
		newName = *req.Name
	}

	if newName == collection.Name {
		return collection, nil
	}

	collection, err = service.sqlDB.Queries().UpdateCollectionByID(ctx, db.UpdateCollectionByIDParams{
		ID:        collectionID,
		Name:      newName,
		UpdatedBy: authUserID,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to update collection", err)
	}

	return collection, nil
}

func (service *collectionService) AddItemToCollection(ctx context.Context, collectionID uuid.UUID, content models.ContentNote) (*db.CollectionItem, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get user ID from context", err)
	}

	collection, err := service.GetByID(ctx, collectionID)
	if err != nil {
		return nil, err
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, collection.UserID, authUserID, types.ModeratorPermission)
	if err != nil {
		return nil, errors.NewInternalServerError("failed to check permission", err)
	}

	if !hasPermission {
		return nil, errors.NewForbiddenError("you are not allowed to add item to collection for this user", nil)
	}

	collectionItem, err := service.sqlDB.Queries().InsertCollectionItem(ctx, db.InsertCollectionItemParams{
		CreatedBy:    authUserID,
		CollectionID: collectionID,
		NoteID:       content.GetID(),
		Category:     content.GetCategory(),
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to add item to collection", err)
	}

	service.clearItemsCountCache(ctx, collectionID)
	return collectionItem, nil
}

func (service *collectionService) RemoveItemFromCollection(ctx context.Context, collectionID uuid.UUID, itemID uuid.UUID) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return errors.NewInternalServerError("failed to get user ID from context", err)
	}

	var (
		group      errgroup.Group
		collection *db.Collection
	)

	group.Go(func() error {
		_, err = service.GetItemByID(ctx, itemID)
		if err != nil {
			return err
		}
		return nil
	})

	group.Go(func() error {
		collection, err = service.GetByID(ctx, collectionID)
		if err != nil {
			return err
		}
		return nil
	})

	err = group.Wait()
	if err != nil {
		return err
	}

	hasPermission, err := service.permissionService.HasPermission(ctx, collection.UserID, authUserID, types.ModeratorPermission)
	if err != nil {
		return errors.NewInternalServerError("failed to check permission", err)
	}

	if !hasPermission {
		return errors.NewForbiddenError("you are not allowed to remove item from this collection", nil)
	}

	err = service.sqlDB.Queries().DeleteCollectionItemByID(ctx, itemID)
	if err != nil {
		return errors.NewInternalServerError("failed to remove item from collection", err)
	}

	service.clearItemsCountCache(ctx, collectionID)
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

func (service *collectionService) GetItemsByCollectionID(ctx context.Context, collectionID uuid.UUID, pagination *types.Pagination, locale string) ([]*db.FindCollectionItemsByCollectionIDWithContentRow, error) {
	collectionItems, err := service.sqlDB.Queries().FindCollectionItemsByCollectionIDWithContent(ctx, db.FindCollectionItemsByCollectionIDWithContentParams{
		CollectionID: collectionID,
		Limit:        int32(pagination.Size),
		Offset:       int32(pagination.From),
		Lang:         db.Locale(locale),
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get items by collection ID", err)
	}

	return collectionItems, nil
}

func (service *collectionService) GetItemsByUserID(ctx context.Context, userID uuid.UUID, pagination *types.Pagination, locale string) ([]*db.FindCollectionItemsByUserIDWithContentLimitPerCollectionRow, error) {
	collectionItems, err := service.sqlDB.Queries().FindCollectionItemsByUserIDWithContentLimitPerCollection(ctx, db.FindCollectionItemsByUserIDWithContentLimitPerCollectionParams{
		UserID: userID,
		Limit:  int16(pagination.Size),
		Lang:   db.Locale(locale),
	})
	if err != nil {
		return nil, errors.NewInternalServerError("failed to get items by user ID", err)
	}

	return collectionItems, nil
}

func (service *collectionService) clearItemsCountCache(ctx context.Context, collectionID uuid.UUID) {
	cacheKey := fmt.Sprintf("collection:%s:items:count", collectionID)
	_ = service.cache.DeleteKey(ctx, cacheKey)
	service.singleflightGroup.Forget(cacheKey)
}

func (service *collectionService) CountCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) (int64, error) {
	cacheKey := fmt.Sprintf("collection:%s:items:count", collectionID)
	count, err := service.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return count, nil
	}

	value, err, _ := service.singleflightGroup.Do(cacheKey, func() (interface{}, error) {
		count, err = service.sqlDB.Queries().CountCollectionItemsByCollectionID(ctx, collectionID)
		if err != nil {
			return 0, errors.NewInternalServerError("failed to count collection items by collection ID", err)
		}

		err = service.cache.SetKey(ctx, cacheKey, count, 24*time.Hour)
		if err != nil {
			return 0, errors.NewInternalServerError("failed to set collection items count to cache", err)
		}

		return count, nil
	})
	if err != nil {
		return 0, err
	}

	count, err = utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, errors.NewInternalServerError("failed to count collection items by collection ID", err)
	}
	return count, nil
}
