package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"golang.org/x/sync/singleflight"
)

type FollowerService interface {
	Follow(ctx context.Context, userId uuid.UUID, followerId uuid.UUID) error
	Unfollow(ctx context.Context, userId uuid.UUID, followerId uuid.UUID) error
	CountFollowers(ctx context.Context, userId uuid.UUID) (int64, error)
	GetFollows(ctx context.Context, followerId uuid.UUID) ([]*db.Profile, error)
	IsFollowing(ctx context.Context, userId uuid.UUID, followerId uuid.UUID) (bool, error)
}

type followerService struct {
	sqlDb storage.RelationalStorage
	cache storage.CacheStorage
	group singleflight.Group
}

func NewFollowerService(sqlDb storage.RelationalStorage, cache storage.CacheStorage) FollowerService {
	return &followerService{
		sqlDb: sqlDb,
		cache: cache,
		group: singleflight.Group{},
	}
}

func (service *followerService) getFollowerCountKey(userId uuid.UUID) string {
	return fmt.Sprintf("follower_count:%s", userId.String())
}

func (service *followerService) clearFollowerCountCache(ctx context.Context, userId uuid.UUID) {
	cacheKey := service.getFollowerCountKey(userId)
	_ = service.cache.DeleteKey(ctx, cacheKey)
	service.group.Forget(cacheKey)
}

func (service *followerService) Follow(ctx context.Context, userId uuid.UUID, followerId uuid.UUID) error {
	isFollowing, err := service.IsFollowing(ctx, userId, followerId)
	if err != nil {
		return err
	}

	if isFollowing {
		return errors.NewBadRequestError("User is already following target user", nil)
	}

	err = service.sqlDb.Queries().InsertFollower(ctx, db.InsertFollowerParams{
		UserID:     userId,
		FollowerID: followerId,
	})
	if err == pgx.ErrNoRows {
		return errors.NewNotFoundError("Follower not found", nil)
	} else if err != nil {
		return errors.NewInternalServerError("Error occurred following user", err)
	}

	service.clearFollowerCountCache(ctx, userId)
	return nil
}

func (service *followerService) Unfollow(ctx context.Context, userId uuid.UUID, followerId uuid.UUID) error {
	isFollowing, err := service.IsFollowing(ctx, userId, followerId)
	if err != nil {
		return err
	}

	if !isFollowing {
		return errors.NewBadRequestError("User is not following target user", nil)
	}

	err = service.sqlDb.Queries().DeleteFollower(ctx, db.DeleteFollowerParams{
		UserID:     userId,
		FollowerID: followerId,
	})
	if err == pgx.ErrNoRows {
		return errors.NewNotFoundError("Follower not found", nil)
	} else if err != nil {
		return errors.NewInternalServerError("Error occurred unfollowing user", err)
	}

	service.clearFollowerCountCache(ctx, userId)
	return nil
}

func (service *followerService) CountFollowers(ctx context.Context, userId uuid.UUID) (int64, error) {
	cacheKey := service.getFollowerCountKey(userId)
	count, err := service.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return count, nil
	}

	value, err, _ := service.group.Do(cacheKey, func() (interface{}, error) {
		count, err := service.sqlDb.Queries().CountFollowers(ctx, userId)
		if err == pgx.ErrNoRows {
			return 0, errors.NewNotFoundError("User not found", nil)
		} else if err != nil {
			return 0, errors.NewInternalServerError("Error occurred counting followers", err)
		}

		_ = service.cache.SetKey(ctx, cacheKey, count, 12*time.Hour)
		return count, nil
	})
	if err != nil {
		return 0, err
	}

	count = value.(int64)
	return count, nil
}

func (service *followerService) GetFollows(ctx context.Context, followerId uuid.UUID) ([]*db.Profile, error) {
	follows, err := service.sqlDb.Queries().GetUserFollows(ctx, followerId)
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Follower not found", nil)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred getting user follows", err)
	}

	return follows, nil
}

func (service *followerService) IsFollowing(ctx context.Context, userId uuid.UUID, followerId uuid.UUID) (bool, error) {
	if userId == followerId {
		return true, nil
	}

	count, err := service.sqlDb.Queries().IsFollowing(ctx, db.IsFollowingParams{
		UserID:     userId,
		FollowerID: followerId,
	})
	if err != nil {
		return false, errors.NewInternalServerError("Error occurred checking if user is following target user", err)
	}
	return count > 0, nil
}
