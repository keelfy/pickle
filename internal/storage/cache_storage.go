package storage

import (
	"context"
	"strings"
	"time"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/redis/go-redis/v9"
)

type CacheStorage interface {
	Ping(ctx context.Context) error
	GetKey(ctx context.Context, key string) (string, error)
	GetInt64(ctx context.Context, key string) (int64, error)
	SetKey(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	DeleteKey(ctx context.Context, key string) error
}

type cacheStorage struct {
	client *redis.Client
}

func NewCacheStorage(ctx context.Context) (CacheStorage, error) {
	logger.Infof(ctx, "%v Redis %v", strings.Repeat("~", 15), strings.Repeat("~", 15))
	url := config.GetRedisURL()
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opts)
	cacheClient := &cacheStorage{
		client: client,
	}

	logger.Infof(ctx, "Client created")
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return cacheClient, nil
}

func (storage *cacheStorage) Ping(ctx context.Context) error {
	err := storage.client.Ping(ctx).Err()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error pinging Redis: %v", err)
	}
	return err
}

func (storage *cacheStorage) GetKey(ctx context.Context, key string) (string, error) {
	value, err := storage.client.Get(ctx, key).Result()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error getting key '%s': %v", key, err)
		return "", err
	}

	logger.Debugf(ctx, "[CACHE] Retrieved value of '%s'", key)
	return value, nil
}

func (storage *cacheStorage) GetInt64(ctx context.Context, key string) (int64, error) {
	value, err := storage.client.Get(ctx, key).Int64()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error getting key '%s': %v", key, err)
		return 0, err
	}
	return value, nil
}

func (storage *cacheStorage) SetKey(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	err := storage.client.Set(ctx, key, value, expiration).Err()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error adding key '%s': %v", key, err)
		return err
	}

	logger.Debugf(ctx, "[CACHE] Added '%s' = '%s'", key, value)
	return nil
}

func (storage *cacheStorage) DeleteKey(ctx context.Context, key string) error {
	err := storage.client.Del(ctx, key).Err()
	if err == redis.Nil {
		return nil
	} else if err != nil {
		logger.Debugf(ctx, "[CACHE] Error deleting key '%s': %v", key, err)
	}

	logger.Debugf(ctx, "[CACHE] Deleted key '%s'", key)
	return err
}
