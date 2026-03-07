package storage

import (
	"context"
	"errors"
	"os"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

// mockS3Client is a mock implementation of S3Client for testing
type mockS3Client struct {
	putObjectFunc     func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	deleteObjectFunc  func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	deleteObjectsFunc func(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error)
	copyObjectFunc    func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error)
}

func (m *mockS3Client) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	if m.putObjectFunc != nil {
		return m.putObjectFunc(ctx, params, optFns...)
	}
	return &s3.PutObjectOutput{}, nil
}

func (m *mockS3Client) DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
	if m.deleteObjectFunc != nil {
		return m.deleteObjectFunc(ctx, params, optFns...)
	}
	return &s3.DeleteObjectOutput{}, nil
}

func (m *mockS3Client) DeleteObjects(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error) {
	if m.deleteObjectsFunc != nil {
		return m.deleteObjectsFunc(ctx, params, optFns...)
	}
	return &s3.DeleteObjectsOutput{}, nil
}

func (m *mockS3Client) CopyObject(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
	if m.copyObjectFunc != nil {
		return m.copyObjectFunc(ctx, params, optFns...)
	}
	return &s3.CopyObjectOutput{}, nil
}

func TestNewFileStorage(t *testing.T) {
	ctx := context.Background()

	// Save original env vars
	originalRegion := os.Getenv("AWS_REGION")
	originalAccessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	originalSecretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	defer func() {
		os.Setenv("AWS_REGION", originalRegion)
		os.Setenv("AWS_ACCESS_KEY_ID", originalAccessKey)
		os.Setenv("AWS_SECRET_ACCESS_KEY", originalSecretKey)
	}()

	t.Run("successful client creation", func(t *testing.T) {
		os.Setenv("AWS_REGION", "us-west-2")
		os.Setenv("AWS_ACCESS_KEY_ID", "test")
		os.Setenv("AWS_SECRET_ACCESS_KEY", "test")

		client, err := NewFileStorage(ctx, zap.NewNop().Sugar())
		assert.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("invalid credentials", func(t *testing.T) {
		os.Unsetenv("AWS_REGION")
		os.Unsetenv("AWS_ACCESS_KEY_ID")
		os.Unsetenv("AWS_SECRET_ACCESS_KEY")

		client, err := NewFileStorage(ctx, zap.NewNop().Sugar())
		assert.Error(t, err)
		assert.Nil(t, client)
	})
}

func TestUploadFile(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name        string
		bucketName  string
		key         string
		fileContent string
		mockFunc    func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
		wantErr     bool
	}{
		{
			name:        "successful upload",
			bucketName:  "test-bucket",
			key:         "test-key",
			fileContent: "test content",
			mockFunc: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
				assert.Equal(t, "test-bucket", *params.Bucket)
				assert.Equal(t, "test-key", *params.Key)
				return &s3.PutObjectOutput{}, nil
			},
			wantErr: false,
		},
		{
			name:        "upload error",
			bucketName:  "test-bucket",
			key:         "test-key",
			fileContent: "test content",
			mockFunc: func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
				return nil, errors.New("upload error")
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockS3Client{putObjectFunc: tt.mockFunc}
			storage := &fileStorage{client: mock, logger: zap.NewNop().Sugar()}

			err := storage.UploadFile(ctx, tt.bucketName, tt.key, strings.NewReader(tt.fileContent))
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestDeleteObject(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name       string
		bucketName string
		key        string
		mockFunc   func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
		wantErr    bool
	}{
		{
			name:       "successful delete",
			bucketName: "test-bucket",
			key:        "test-key",
			mockFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
				assert.Equal(t, "test-bucket", *params.Bucket)
				assert.Equal(t, "test-key", *params.Key)
				return &s3.DeleteObjectOutput{}, nil
			},
			wantErr: false,
		},
		{
			name:       "delete error",
			bucketName: "test-bucket",
			key:        "test-key",
			mockFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
				return nil, errors.New("delete error")
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockS3Client{deleteObjectFunc: tt.mockFunc}
			storage := &fileStorage{client: mock, logger: zap.NewNop().Sugar()}

			err := storage.DeleteObject(ctx, tt.bucketName, tt.key)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestBulkDeleteObject(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name       string
		bucketName string
		keys       []string
		mockFunc   func(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error)
		wantErr    bool
	}{
		{
			name:       "successful bulk delete",
			bucketName: "test-bucket",
			keys:       []string{"key1", "key2", "key3"},
			mockFunc: func(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error) {
				assert.Equal(t, "test-bucket", *params.Bucket)
				assert.Equal(t, 3, len(params.Delete.Objects))
				return &s3.DeleteObjectsOutput{}, nil
			},
			wantErr: false,
		},
		{
			name:       "bulk delete error",
			bucketName: "test-bucket",
			keys:       []string{"key1", "key2"},
			mockFunc: func(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error) {
				return nil, errors.New("bulk delete error")
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockS3Client{deleteObjectsFunc: tt.mockFunc}
			storage := &fileStorage{client: mock, logger: zap.NewNop().Sugar()}

			err := storage.BulkDeleteObject(ctx, tt.bucketName, tt.keys)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestCopyObject(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name          string
		oldBucketName string
		newBucketName string
		oldKey        string
		newKey        string
		mockFunc      func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error)
		wantErr       bool
	}{
		{
			name:          "successful copy",
			oldBucketName: "old-bucket",
			newBucketName: "new-bucket",
			oldKey:        "old-key",
			newKey:        "new-key",
			mockFunc: func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
				assert.Equal(t, "new-bucket", *params.Bucket)
				assert.Equal(t, "old-bucket/old-key", *params.CopySource)
				assert.Equal(t, "new-key", *params.Key)
				return &s3.CopyObjectOutput{}, nil
			},
			wantErr: false,
		},
		{
			name:          "copy error",
			oldBucketName: "old-bucket",
			newBucketName: "new-bucket",
			oldKey:        "old-key",
			newKey:        "new-key",
			mockFunc: func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
				return nil, errors.New("copy error")
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockS3Client{copyObjectFunc: tt.mockFunc}
			storage := &fileStorage{client: mock, logger: zap.NewNop().Sugar()}

			err := storage.CopyObject(ctx, tt.oldBucketName, tt.newBucketName, tt.oldKey, tt.newKey)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestMoveObject(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name           string
		oldBucketName  string
		newBucketName  string
		oldKey         string
		newKey         string
		copyMockFunc   func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error)
		deleteMockFunc func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
		wantErr        bool
	}{
		{
			name:          "successful move",
			oldBucketName: "old-bucket",
			newBucketName: "new-bucket",
			oldKey:        "old-key",
			newKey:        "new-key",
			copyMockFunc: func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
				return &s3.CopyObjectOutput{}, nil
			},
			deleteMockFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
				return &s3.DeleteObjectOutput{}, nil
			},
			wantErr: false,
		},
		{
			name:          "copy error",
			oldBucketName: "old-bucket",
			newBucketName: "new-bucket",
			oldKey:        "old-key",
			newKey:        "new-key",
			copyMockFunc: func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
				return nil, errors.New("copy error")
			},
			deleteMockFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
				return &s3.DeleteObjectOutput{}, nil
			},
			wantErr: true,
		},
		{
			name:          "delete error",
			oldBucketName: "old-bucket",
			newBucketName: "new-bucket",
			oldKey:        "old-key",
			newKey:        "new-key",
			copyMockFunc: func(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error) {
				return &s3.CopyObjectOutput{}, nil
			},
			deleteMockFunc: func(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error) {
				return nil, errors.New("delete error")
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockS3Client{
				copyObjectFunc:   tt.copyMockFunc,
				deleteObjectFunc: tt.deleteMockFunc,
			}
			storage := &fileStorage{client: mock, logger: zap.NewNop().Sugar()}

			err := storage.MoveObject(ctx, tt.oldBucketName, tt.newBucketName, tt.oldKey, tt.newKey)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
