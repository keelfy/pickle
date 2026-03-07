package storage

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

type testCase[T any] struct {
	name     string
	setup    func(*miniredis.Miniredis)
	input    T
	expected T
	wantErr  bool
}

func setupTestRedis(t *testing.T) (*miniredis.Miniredis, CacheStorage) {
	t.Helper()
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	return mr, &cacheStorage{client: client, logger: zap.NewNop().Sugar()}
}

func TestNewCacheClient(t *testing.T) {
	// don't run this test in parallel since it modifies environment variables
	originalURL := os.Getenv("REDIS_URL")
	defer os.Setenv("REDIS_URL", originalURL) // Restore original value after test

	tests := []struct {
		name     string
		redisURL string
		wantErr  bool
	}{
		{
			name:     "should create new cache client",
			redisURL: "redis://localhost:6379",
			wantErr:  false,
		},
		{
			name:     "should fail with invalid redis url",
			redisURL: "invalid://localhost:6379",
			wantErr:  true,
		},
		{
			name:     "should fail with empty redis url",
			redisURL: "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set up environment for this test case
			os.Setenv("REDIS_URL", tt.redisURL)

			client, err := NewCacheStorage(zap.NewNop().Sugar())
			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, client)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, client)
			}
		})
	}
}

func TestCacheClient_Ping(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	tests := []struct {
		name    string
		setup   func(*miniredis.Miniredis)
		wantErr bool
	}{
		{
			name:    "successful ping",
			setup:   func(mr *miniredis.Miniredis) {},
			wantErr: false,
		},
		{
			name: "failed ping - redis down",
			setup: func(mr *miniredis.Miniredis) {
				mr.Close()
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mr, client := setupTestRedis(t)
			defer mr.Close()

			tt.setup(mr)

			err := client.Ping(ctx)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestCacheClient_GetKey(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	tests := []testCase[struct {
		key           string
		expectedValue string
	}]{
		{
			name: "get existing key",
			setup: func(mr *miniredis.Miniredis) {
				mr.Set("test-key", "test-value")
			},
			input: struct {
				key           string
				expectedValue string
			}{
				key:           "test-key",
				expectedValue: "test-value",
			},
			wantErr: false,
		},
		{
			name:  "get non-existing key",
			setup: func(mr *miniredis.Miniredis) {},
			input: struct {
				key           string
				expectedValue string
			}{
				key:           "non-existing-key",
				expectedValue: "",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mr, client := setupTestRedis(t)
			defer mr.Close()

			tt.setup(mr)

			value, err := client.GetKey(ctx, tt.input.key)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.input.expectedValue, value)
			}
		})
	}
}

func TestCacheClient_SetKey(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	tests := []struct {
		name        string
		key         string
		value       string
		expiration  time.Duration
		setup       func(*miniredis.Miniredis)
		wantErr     bool
		checkResult func(*testing.T, *miniredis.Miniredis, string, string)
	}{
		{
			name:       "set new key",
			key:        "test-key",
			value:      "test-value",
			expiration: time.Minute,
			setup:      func(mr *miniredis.Miniredis) {},
			wantErr:    false,
			checkResult: func(t *testing.T, mr *miniredis.Miniredis, key, value string) {
				val, err := mr.Get(key)
				require.NoError(t, err)
				assert.Equal(t, value, val)
				assert.True(t, mr.TTL(key) > 0)
			},
		},
		{
			name:       "override existing key",
			key:        "test-key",
			value:      "new-value",
			expiration: time.Minute,
			setup: func(mr *miniredis.Miniredis) {
				mr.Set("test-key", "old-value")
			},
			wantErr: false,
			checkResult: func(t *testing.T, mr *miniredis.Miniredis, key, value string) {
				val, err := mr.Get(key)
				require.NoError(t, err)
				assert.Equal(t, value, val)
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mr, client := setupTestRedis(t)
			defer mr.Close()

			tt.setup(mr)

			err := client.SetKey(ctx, tt.key, tt.value, tt.expiration)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				tt.checkResult(t, mr, tt.key, tt.value)
			}
		})
	}
}

func TestCacheClient_DeleteKey(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	tests := []struct {
		name    string
		key     string
		setup   func(*miniredis.Miniredis)
		wantErr bool
	}{
		{
			name: "delete existing key",
			key:  "test-key",
			setup: func(mr *miniredis.Miniredis) {
				mr.Set("test-key", "test-value")
			},
			wantErr: false,
		},
		{
			name:    "delete non-existing key",
			key:     "non-existing-key",
			setup:   func(mr *miniredis.Miniredis) {},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mr, client := setupTestRedis(t)
			defer mr.Close()

			tt.setup(mr)

			err := client.DeleteKey(ctx, tt.key)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				exists := mr.Exists(tt.key)
				assert.False(t, exists)
			}
		})
	}
}
