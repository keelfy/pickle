package storage

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Uploader struct {
	client     *s3.Client
	bucketName string
}

func NewS3Uploader(bucketName string) (*S3Uploader, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg)
	return &S3Uploader{
		client:     client,
		bucketName: bucketName,
	}, nil
}

func (u *S3Uploader) UploadFileToS3(ctx context.Context, file multipart.File, fileName string) (string, error) {
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
	_, err = u.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(u.bucketName),
		Key:    aws.String(fileName),
		Body:   tempFile,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to S3: %w", err)
	}

	// Return the public URL of the uploaded file
	publicURL := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", u.bucketName, fileName)
	return publicURL, nil
}
