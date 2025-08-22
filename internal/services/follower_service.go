package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/singleflight"
)

type FollowerService interface {
	Follow(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error
	Unfollow(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error
	CountFollowers(ctx context.Context, userID uuid.UUID) (int64, error)
	GetFollows(ctx context.Context, followerID uuid.UUID) ([]*domain.DetailedUser, error)
	IsFollowing(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) (bool, error)
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

func (s *followerService) getFollowerCountKey(userId uuid.UUID) string {
	return fmt.Sprintf("follower_count:%s", userId.String())
}

func (s *followerService) clearFollowerCountCache(ctx context.Context, userID uuid.UUID) {
	cacheKey := s.getFollowerCountKey(userID)
	_ = s.cache.DeleteKey(ctx, cacheKey)
	s.group.Forget(cacheKey)
}

func (s *followerService) Follow(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error {
	err := s.sqlDb.Queries().InsertFollower(ctx, userID, followerID)
	if err == pgx.ErrNoRows {
		return utils.NewNotFoundError("Follower not found", nil)
	} else if err != nil {
		return utils.NewInternalServerError("Error occurred following user", err)
	}

	s.clearFollowerCountCache(ctx, userID)
	return nil
}

func (s *followerService) Unfollow(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error {
	err := s.sqlDb.Queries().DeleteFollower(ctx, userID, followerID)
	if err == pgx.ErrNoRows {
		return utils.NewNotFoundError("Follower not found", nil)
	} else if err != nil {
		return utils.NewInternalServerError("Error occurred unfollowing user", err)
	}

	s.clearFollowerCountCache(ctx, userID)
	return nil
}

func (s *followerService) CountFollowers(ctx context.Context, userID uuid.UUID) (int64, error) {
	cacheKey := s.getFollowerCountKey(userID)
	count, err := s.cache.GetInt64(ctx, cacheKey)
	if err == nil {
		return count, nil
	}

	value, err, _ := s.group.Do(cacheKey, func() (interface{}, error) {
		count, err := s.sqlDb.Queries().CountFollowers(ctx, userID)
		if err == pgx.ErrNoRows {
			return 0, utils.NewNotFoundError("User not found", nil)
		} else if err != nil {
			return 0, utils.NewInternalServerError("Error occurred counting followers", err)
		}

		_ = s.cache.SetKey(ctx, cacheKey, count, 12*time.Hour)
		return count, nil
	})
	if err != nil {
		return 0, err
	}

	count, err = utils.ConvertAnyToInt64(value)
	if err != nil {
		return 0, utils.NewInternalServerError("Error occurred counting followers", err)
	}
	return count, nil
}

func (s *followerService) GetFollows(ctx context.Context, followerID uuid.UUID) ([]*domain.DetailedUser, error) {
	follows, err := s.sqlDb.Queries().GetUserFollows(ctx, followerID)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("Follower not found", nil)
	} else if err != nil {
		return nil, utils.NewInternalServerError("Error occurred getting user follows", err)
	}

	users := make([]*domain.DetailedUser, 0, len(follows))
	for _, follow := range follows {
		users = append(users, follow)
	}

	return users, nil
}

func (s *followerService) IsFollowing(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) (bool, error) {
	if userID == followerID {
		return true, nil
	}

	count, err := s.sqlDb.Queries().IsFollowing(ctx, userID, followerID)
	if err != nil {
		return false, utils.NewInternalServerError("Error occurred checking if user is following target user", err)
	}
	return count > 0, nil
}
