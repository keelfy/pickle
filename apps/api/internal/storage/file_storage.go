package storage

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3Types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"go.uber.org/zap"
)

type S3Client interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, params *s3.DeleteObjectInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	DeleteObjects(ctx context.Context, params *s3.DeleteObjectsInput, optFns ...func(*s3.Options)) (*s3.DeleteObjectsOutput, error)
	CopyObject(ctx context.Context, params *s3.CopyObjectInput, optFns ...func(*s3.Options)) (*s3.CopyObjectOutput, error)
}

type FileStorage interface {
	UploadFile(ctx context.Context, bucketName, key string, fileReader io.Reader) error
	DeleteObject(ctx context.Context, bucketName, key string) error
	BulkDeleteObject(ctx context.Context, bucketName string, keys []string) error
	CopyObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error
	MoveObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error
}

type fileStorage struct {
	client S3Client
	logger *zap.SugaredLogger
}

func NewFileStorage(ctx context.Context, zapLogger *zap.SugaredLogger) (FileStorage, error) {
	// Check required environment variables
	region := os.Getenv("AWS_REGION")
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	if region == "" || accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("missing required AWS credentials: AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY must be set")
	}

	cfg, err := awsConfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS SDK config: %v", err)
	}

	client := s3.NewFromConfig(cfg)
	s3Client := &fileStorage{
		client: client,
		logger: zapLogger,
	}

	return s3Client, nil
}

func (storage *fileStorage) UploadFile(ctx context.Context, bucketName, key string, fileReader io.Reader) error {
	// Read file content into a temporary file
	tempFile, err := os.CreateTemp("", "upload-")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	// Copy the multipart file content to the temp file
	if _, err := io.Copy(tempFile, fileReader); err != nil {
		return fmt.Errorf("failed to copy file content to temp file: %w", err)
	}

	// Reset the file pointer to the beginning of tempFile
	if _, err := tempFile.Seek(0, 0); err != nil {
		return fmt.Errorf("failed to reset temp file pointer: %w", err)
	}

	// Upload the file to S3
	_, err = storage.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   tempFile,
	})
	if err != nil {
		storage.logger.Debugf("[S3] Error uploading file to S3: %v", err)
		return fmt.Errorf("failed to upload file to S3: %w", err)
	}
	storage.logger.Debugf("[S3] File uploaded to S3: %s/%s", bucketName, key)
	return nil
}

func (storage *fileStorage) DeleteObject(ctx context.Context, bucketName, key string) error {
	output, err := storage.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		storage.logger.Debugf("[S3] Error deleting object: %v", err)
		return fmt.Errorf("failed to delete object: %w", err)
	}
	storage.logger.Debugf("[S3] Object deleted from %s/%s [DeleteMarker=%v,RequestCharged=%v]", bucketName, key, output.DeleteMarker, output.RequestCharged)
	return nil
}

func (storage *fileStorage) BulkDeleteObject(ctx context.Context, bucketName string, keys []string) error {
	objects := make([]s3Types.ObjectIdentifier, len(keys))
	for i, key := range keys {
		objects[i] = s3Types.ObjectIdentifier{
			Key: aws.String(key),
		}
	}

	output, err := storage.client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(bucketName),
		Delete: &s3Types.Delete{
			Objects: objects,
		},
	})
	if err != nil {
		storage.logger.Debugf("[S3] Error bulk deleting objects: %v", err)
		return fmt.Errorf("failed to bulk delete objects: %w", err)
	}
	storage.logger.Debugf("[S3] Bulk objects deleted from %s: %v [RequestCharged=%v]", bucketName, keys, output.RequestCharged)
	return nil
}

func (storage *fileStorage) CopyObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error {
	output, err := storage.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(newBucketName),
		CopySource: aws.String(fmt.Sprintf("%s/%s", oldBucketName, oldKey)),
		Key:        aws.String(newKey),
	})
	if err != nil {
		storage.logger.Debugf("[S3] Failed to copy object %s to %s: %v", oldKey, newKey, err)
		return fmt.Errorf("failed to copy object: %w", err)
	}
	storage.logger.Debugf("[S3] File copied from %s/%s to %s/%s [RequestCharged=%v]", oldBucketName, oldKey, newBucketName, newKey, output.RequestCharged)
	return nil
}

func (storage *fileStorage) MoveObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error {
	err := storage.CopyObject(ctx, oldBucketName, newBucketName, oldKey, newKey)
	if err != nil {
		return fmt.Errorf("failed to copy object: %w", err)
	}
	err = storage.DeleteObject(ctx, oldBucketName, oldKey)
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}
	return nil
}
