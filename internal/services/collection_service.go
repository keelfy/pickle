package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/singleflight"
)

type CollectionService interface {
	GetByID(ctx context.Context, collectionID uuid.UUID) (*domain.Collection, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Collection, error)
	CreateCollection(ctx context.Context, cmd *commands.CreateCollectionCommand) (*domain.Collection, error)
	DeleteCollection(ctx context.Context, cmd *commands.DeleteCollectionCommand) error
	UpdateCollection(ctx context.Context, cmd *commands.UpdateCollectionCommand) (*domain.Collection, error)

	// items
	AddItemToCollection(ctx context.Context, content domain.IContent, note domain.IContentNote, cmd *commands.AddCollectionItemCommand) (*domain.CollectionItem, error)
	RemoveItemFromCollection(ctx context.Context, cmd *commands.DeleteCollectionItemCommand) error
	GetItemByID(ctx context.Context, itemID uuid.UUID) (*domain.CollectionItem, error)
	GetItemsWithContentByCollectionID(ctx context.Context, collectionID uuid.UUID, pagination *domain.Pagination) ([]*domain.CollectionItem, error)
	GetItemsWithContentByUserID(ctx context.Context, cmd *commands.GetCollectionItemsByUserIDCommand) ([]*domain.CollectionItem, error)
	CountCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) (int64, error)
	ClearItemsCountCache(ctx context.Context, collectionID uuid.UUID)
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

func (s *collectionService) CreateCollection(ctx context.Context, cmd *commands.CreateCollectionCommand) (*domain.Collection, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get user ID from context", err)
	}

	collection, err := s.sqlDB.Queries().InsertCollection(ctx, sql.InsertCollectionParams{
		CreatedBy: authUserID,
		UpdatedBy: authUserID,
		Name:      cmd.Name,
		UserID:    cmd.UserID,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to create collection", err)
	}

	return collection, nil
}

func (s *collectionService) DeleteCollection(ctx context.Context, cmd *commands.DeleteCollectionCommand) error {
	return s.sqlDB.BeginTx(ctx, func(tx sql.Queries) error {
		err := tx.DeleteCollectionItemsByCollectionID(ctx, cmd.CollectionID)
		if err != nil {
			return utils.NewInternalServerError("failed to delete collection items", err)
		}

		err = tx.DeleteCollectionByID(ctx, cmd.CollectionID)
		if err != nil {
			return utils.NewInternalServerError("failed to delete collection", err)
		}

		return nil
	})
}

func (s *collectionService) UpdateCollection(ctx context.Context, cmd *commands.UpdateCollectionCommand) (*domain.Collection, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get user ID from context", err)
	}

	collection, err := s.sqlDB.Queries().UpdateCollectionByID(ctx, sql.UpdateCollectionByIDParams{
		ID:        cmd.CollectionID,
		Name:      cmd.Name,
		UpdatedBy: authUserID,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to update collection", err)
	}

	return collection, nil
}

func (s *collectionService) AddItemToCollection(ctx context.Context, content domain.IContent, note domain.IContentNote, cmd *commands.AddCollectionItemCommand) (*domain.CollectionItem, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get user ID from context", err)
	}

	collectionItem, err := s.sqlDB.Queries().InsertCollectionItem(ctx, sql.InsertCollectionItemParams{
		CreatedBy:    authUserID,
		CollectionID: cmd.CollectionID,
		NoteID:       note.GetID(),
		ContentID:    content.GetID(),
		Category:     content.GetCategory(),
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to add item to collection", err)
	}
	return collectionItem, nil
}

func (s *collectionService) RemoveItemFromCollection(ctx context.Context, cmd *commands.DeleteCollectionItemCommand) error {
	err := s.sqlDB.Queries().DeleteCollectionItemByID(ctx, cmd.ItemID)
	if err != nil {
		return utils.NewInternalServerError("failed to remove item from collection", err)
	}

	s.ClearItemsCountCache(ctx, cmd.CollectionID)
	return nil
}

func (s *collectionService) GetByID(ctx context.Context, collectionID uuid.UUID) (*domain.Collection, error) {
	collection, err := s.sqlDB.Queries().FindCollectionByID(ctx, collectionID)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get collection by ID", err)
	}

	return collection, nil
}

func (s *collectionService) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Collection, error) {
	collections, err := s.sqlDB.Queries().FindCollectionsByUserID(ctx, userID)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get collections by user ID", err)
	}

	return collections, nil
}

func (s *collectionService) GetItemByID(ctx context.Context, itemID uuid.UUID) (*domain.CollectionItem, error) {
	collectionItem, err := s.sqlDB.Queries().FindCollectionItemByID(ctx, itemID)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get item by ID", err)
	}

	return collectionItem, nil
}

func (s *collectionService) GetItemsWithContentByCollectionID(ctx context.Context, collectionID uuid.UUID, pagination *domain.Pagination) ([]*domain.CollectionItem, error) {
	locale := utils.GetLocaleFromCtx(ctx)
	collectionItems, err := s.sqlDB.Queries().FindCollectionItemsByCollectionIDWithContent(ctx, collectionID, locale, pagination)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get items by collection ID", err)
	}

	return collectionItems, nil
}

func (s *collectionService) GetItemsWithContentByUserID(ctx context.Context, cmd *commands.GetCollectionItemsByUserIDCommand) ([]*domain.CollectionItem, error) {
	locale := utils.GetLocaleFromCtx(ctx)
	collectionItems, err := s.sqlDB.Queries().FindCollectionItemsByUserIDWithContentLimitPerCollection(ctx, cmd.UserID, int16(cmd.Pagination.Size), locale)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to get items by user ID", err)
	}

	return collectionItems, nil
}

func (s *collectionService) ClearItemsCountCache(ctx context.Context, collectionID uuid.UUID) {
	cacheKey := fmt.Sprintf("collection:%s:items:count", collectionID)
	_ = s.cache.DeleteKey(ctx, cacheKey)
	s.singleflightGroup.Forget(cacheKey)
}

func (s *collectionService) CountCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) (int64, error) {
	cacheKey := fmt.Sprintf("collection:%s:items:count", collectionID)
	count, err := s.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return count, nil
	}

	value, err, _ := s.singleflightGroup.Do(cacheKey, func() (interface{}, error) {
		count, err = s.sqlDB.Queries().CountCollectionItemsByCollectionID(ctx, collectionID)
		if err != nil {
			return 0, utils.NewInternalServerError("failed to count collection items by collection ID", err)
		}

		err = s.cache.SetKey(ctx, cacheKey, count, 24*time.Hour)
		if err != nil {
			return 0, utils.NewInternalServerError("failed to set collection items count to cache", err)
		}

		return count, nil
	})
	if err != nil {
		return 0, err
	}

	count, err = utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, utils.NewInternalServerError("failed to count collection items by collection ID", err)
	}
	return count, nil
}
