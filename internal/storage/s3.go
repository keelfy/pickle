package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func InitS3Client() (*s3.Client, error) {
	log.Printf("%v S3 Uploader %v\n", strings.Repeat("~", 12), strings.Repeat("~", 12))

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS SDK config: %v", err)
	}

	client := s3.NewFromConfig(cfg)
	log.Println("S3 client created")

	log.Println(strings.Repeat("~", 37))
	return client, nil
}

func UploadFileToS3(ctx context.Context, bucketName, fileName string, file multipart.File, s3Client *s3.Client) (string, error) {
	// Read file content into a temporary file
	tempFile, err := os.CreateTemp("", "upload-")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	// Copy the multipart file content to the temp file
	if _, err := io.Copy(tempFile, file); err != nil {
		return "", fmt.Errorf("failed to copy file content to temp file: %w", err)
	}

	// Reset the file pointer to the beginning of tempFile
	if _, err := tempFile.Seek(0, 0); err != nil {
		return "", fmt.Errorf("failed to reset temp file pointer: %w", err)
	}

	// Upload the file to S3
	_, err = s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(fileName),
		Body:   tempFile,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to S3: %w", err)
	}

	return fileName, nil
}

func MoveS3File(ctx context.Context, oldBucketName, newBucketName, oldKey, newKey string, s3Client *s3.Client) error {
	_, err := s3Client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(newBucketName),
		CopySource: aws.String(fmt.Sprintf("%s/%s", oldBucketName, oldKey)),
		Key:        aws.String(newKey),
	})
	if err != nil {
		return fmt.Errorf("failed to copy object: %w", err)
	}

	_, err = s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(oldBucketName),
		Key:    aws.String(oldKey),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}

	return nil
}
