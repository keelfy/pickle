package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3Types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/pickle.pw/monolith/internal/logger"
)

type S3Client interface {
	UploadFileToS3(ctx context.Context, bucketName, key string, fileReader io.Reader) error
	DeleteObject(ctx context.Context, bucketName, key string) error
	BulkDeleteObject(ctx context.Context, bucketName string, keys []string) error
	CopyObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error
	MoveObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error
}

type s3Client struct {
	client *s3.Client
}

func NewS3Client(ctx context.Context) (S3Client, error) {
	logger.Infof(ctx, "%v S3 Uploader %v", strings.Repeat("~", 12), strings.Repeat("~", 12))

	cfg, err := awsConfig.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS SDK config: %v", err)
	}

	client := s3.NewFromConfig(cfg)
	logger.Infof(ctx, "S3 client created")

	s3Client := &s3Client{
		client: client,
	}

	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return s3Client, nil
}

func (storage *s3Client) UploadFileToS3(ctx context.Context, bucketName, key string, fileReader io.Reader) error {
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
		logger.Debugf(ctx, "[S3] Error uploading file to S3: %v", err)
		return fmt.Errorf("failed to upload file to S3: %w", err)
	}

	logger.Debugf(ctx, "[S3] File uploaded to S3: %s/%s", bucketName, key)
	return nil
}

func (storage *s3Client) DeleteObject(ctx context.Context, bucketName, key string) error {
	output, err := storage.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		logger.Debugf(ctx, "[S3] Error deleting object: %v", err)
		return fmt.Errorf("failed to delete object: %w", err)
	}

	logger.Debugf(ctx, "[S3] Object deleted from %s/%s [DeleteMarker=%v,RequestCharged=%v]", bucketName, key, output.DeleteMarker, output.RequestCharged)
	return nil
}

func (storage *s3Client) BulkDeleteObject(ctx context.Context, bucketName string, keys []string) error {
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
		logger.Debugf(ctx, "[S3] Error bulk deleting objects: %v", err)
		return fmt.Errorf("failed to bulk delete objects: %w", err)
	}

	logger.Debugf(ctx, "[S3] Bulk objects deleted from %s: %v [RequestCharged=%v]", bucketName, keys, output.RequestCharged)
	return nil
}

func (storage *s3Client) CopyObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error {
	output, err := storage.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(newBucketName),
		CopySource: aws.String(fmt.Sprintf("%s/%s", oldBucketName, oldKey)),
		Key:        aws.String(newKey),
	})
	if err != nil {
		logger.Debugf(ctx, "[S3] Failed to copy object %s to %s: %v", oldKey, newKey, err)
		return fmt.Errorf("failed to copy object: %w", err)
	}

	logger.Debugf(ctx, "[S3] File copied from %s/%s to %s/%s [RequestCharged=%v]", oldBucketName, oldKey, newBucketName, newKey, output.RequestCharged)
	return nil
}

func (storage *s3Client) MoveObject(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string) error {
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
