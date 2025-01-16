package storage

import (
	"context"
	"strings"
	"time"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/redis/go-redis/v9"
)

type CacheClient interface {
	Ping(ctx context.Context) error
	GetKey(ctx context.Context, key string) (*string, error)
	SetKey(ctx context.Context, key string, value string, expiration time.Duration) error
	DeleteKey(ctx context.Context, key string) error
}

type cacheClient struct {
	client *redis.Client
}

func NewCacheClient(ctx context.Context) (CacheClient, error) {
	logger.Infof(ctx, "%v Redis %v", strings.Repeat("~", 15), strings.Repeat("~", 15))
	url := config.GetRedisURL()
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opts)
	cacheClient := &cacheClient{
		client: client,
	}

	logger.Infof(ctx, "Client created")
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return cacheClient, nil
}

func (storage *cacheClient) Ping(ctx context.Context) error {
	err := storage.client.Ping(ctx).Err()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error pinging Redis: %v", err)
	}
	return err
}

func (storage *cacheClient) GetKey(ctx context.Context, key string) (*string, error) {
	value, err := storage.client.Get(ctx, key).Result()
	if err == nil {
		logger.Debugf(ctx, "[CACHE] Retrieved value of '%s'", key)
		return &value, nil
	} else if err != redis.Nil {
		logger.Debugf(ctx, "[CACHE] Error getting key '%s': %v", key, err)
		return nil, err
	}

	logger.Debugf(ctx, "[CACHE] Key '%s' not found", key)
	return nil, nil
}

func (storage *cacheClient) SetKey(ctx context.Context, key string, value string, expiration time.Duration) error {
	err := storage.client.Set(ctx, key, value, expiration).Err()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error adding key '%s': %v", key, err)
		return err
	}

	logger.Debugf(ctx, "[CACHE] Added '%s' = '%s'", key, value)
	return nil
}

func (storage *cacheClient) DeleteKey(ctx context.Context, key string) error {
	err := storage.client.Del(ctx, key).Err()
	if err == redis.Nil {
		return nil
	} else if err != nil {
		logger.Debugf(ctx, "[CACHE] Error deleting key '%s': %v", key, err)
	}

	logger.Debugf(ctx, "[CACHE] Deleted key '%s'", key)
	return err
}
