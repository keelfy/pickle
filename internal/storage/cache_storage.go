package storage

import (
	"context"
	"errors"
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
	stringCmd := storage.client.Get(ctx, key)
	if stringCmd == nil {
		return "", errors.New("stringCmd is nil")
	}

	value, err := stringCmd.Result()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error getting key '%s': %v", key, err)
		return "", err
	}

	logger.Debugf(ctx, "[CACHE] Retrieved value of '%s'", key)
	return value, nil
}

func (storage *cacheStorage) GetInt64(ctx context.Context, key string) (int64, error) {
	int64Cmd := storage.client.Get(ctx, key)
	if int64Cmd == nil {
		return 0, errors.New("int64Cmd is nil")
	}

	value, err := int64Cmd.Int64()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error getting key '%s': %v", key, err)
		return 0, err
	}

	logger.Debugf(ctx, "[CACHE] Retrieved value of '%s'", key)
	return value, nil
}

func (storage *cacheStorage) SetKey(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	setCmd := storage.client.Set(ctx, key, value, expiration)
	if setCmd == nil {
		return errors.New("setCmd is nil")
	}

	err := setCmd.Err()
	if err != nil {
		logger.Debugf(ctx, "[CACHE] Error adding key '%s': %v", key, err)
		return err
	}

	logger.Debugf(ctx, "[CACHE] Added '%s' = '%s'", key, value)
	return nil
}

func (storage *cacheStorage) DeleteKey(ctx context.Context, key string) error {
	deleteCmd := storage.client.Del(ctx, key)
	if deleteCmd == nil {
		return errors.New("deleteCmd is nil")
	}

	err := deleteCmd.Err()
	if err == redis.Nil {
		return nil
	} else if err != nil {
		logger.Debugf(ctx, "[CACHE] Error deleting key '%s': %v", key, err)
	}

	logger.Debugf(ctx, "[CACHE] Deleted key '%s'", key)
	return err
}
