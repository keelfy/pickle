package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage"
)

type PosterService interface {
	GetPosterPreviewByID(ctx context.Context, id uuid.UUID) (*db.PosterPreview, error)
	UploadPosterForPreview(ctx context.Context, userId uuid.UUID, size string, file multipart.File, fileHeader *multipart.FileHeader) (uuid.UUID, string, error)
	EmbedPosterForPreview(ctx context.Context, userId uuid.UUID, size, embeddedUrl string) (uuid.UUID, string, error)
	GetLatestPosterPreviewByUserId(ctx context.Context, userId uuid.UUID) ([]*db.PosterPreview, error)
	ConfirmS3PosterPreviewByID(ctx context.Context, id uuid.UUID, prefix string) (*string, error)
	GetPosterImageURL(ctx context.Context, prefix, size, imageKey string, cbTime time.Time) (string, error)
}

type posterService struct {
	sqlDB          storage.SQLDatabase
	s3             storage.S3Client
	cache          storage.CacheClient
	imageService   ImageService
	profileService ProfileService
}

func NewPosterService(
	sqlDB storage.SQLDatabase, s3 storage.S3Client, cache storage.CacheClient,
	imageService ImageService, profileService ProfileService,
) PosterService {
	return &posterService{
		sqlDB:          sqlDB,
		s3:             s3,
		cache:          cache,
		imageService:   imageService,
		profileService: profileService,
	}
}

var posterSizes = map[string][]int{
	"sm": {100, 150},
	"md": {150, 225},
	"lg": {300, 450},
}

func (s *posterService) GetPosterPreviewByID(ctx context.Context, id uuid.UUID) (*db.PosterPreview, error) {
	posterPreview, err := s.sqlDB.Queries().FindPosterPreviewById(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, errors.NewBadRequestError("Poster preview not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred getting poster preview", err)
	}
	return posterPreview, nil
}

func (s *posterService) uploadPosterForPreview(ctx context.Context, userId uuid.UUID, size string, fileReader io.Reader, fileExtension string) (uuid.UUID, string, error) {
	if _, ok := posterSizes[size]; !ok {
		return uuid.Nil, "", errors.NewBadRequestError("Invalid size", nil)
	}

	profile, err := s.profileService.GetProfileById(ctx, userId)
	if err != nil {
		return uuid.Nil, "", err
	}

	if profile == nil {
		return uuid.Nil, "", errors.NewBadRequestError("Profile not found", nil)
	}

	posterPreviewId := uuid.New()
	objectKey := fmt.Sprintf("%s%s", posterPreviewId, fileExtension)

	bucketName := config.GetContentPosterBucketName()
	previewKey := "preview/" + objectKey

	// Upload the file to S3
	err = s.s3.UploadFileToS3(ctx, bucketName, previewKey, fileReader)
	if err != nil {
		return uuid.Nil, "", errors.NewInternalServerError("Error occurred uploading file", err)
	}

	err = s.sqlDB.Queries().InsertPosterPreview(ctx, db.InsertPosterPreviewParams{
		ID:        posterPreviewId,
		CreatedBy: userId,
		ObjectKey: objectKey,
	})
	if err != nil {
		if err1 := s.s3.DeleteObject(ctx, bucketName, previewKey); err1 != nil {
			logger.Errorf(ctx, "Error occurred deleting preview avatar: %v", err1)
		}
		return uuid.Nil, "", errors.NewInternalServerError("Error occurred inserting poster preview", err)
	}

	// delete previews if more than 5 or older than 1 day

	existingPreviews, err := s.sqlDB.Queries().FindPosterPreviewByCreatedBy(ctx, profile.UserID)
	if err != nil {
		logger.Errorf(ctx, "Error occurred getting poster previews: %v", err)
	}

	keysToDelete := make([]string, 0)

	for index, preview := range existingPreviews {
		if preview.ObjectKey == previewKey {
			continue
		}

		if index > 5 || preview.CreatedAt.Before(time.Now().Add(config.GetPosterPreviewStoreTime())) {
			keysToDelete = append(keysToDelete, preview.ObjectKey)
		}
	}

	if len(keysToDelete) > 0 {
		_ = s.s3.BulkDeleteObject(ctx, bucketName, keysToDelete)
	}

	// generate imgproxy URL for preview

	dims := posterSizes[size]
	imageUrl, err := s.imageService.GetResizedImageUrlFromS3(bucketName, previewKey, dims[0], dims[1], nil)
	if err != nil {
		return uuid.Nil, "", errors.NewInternalServerError("Error occurred getting profile avatar URL", err)
	}

	return posterPreviewId, imageUrl, nil
}

func (s *posterService) UploadPosterForPreview(ctx context.Context, userId uuid.UUID, size string, file multipart.File, fileHeader *multipart.FileHeader) (uuid.UUID, string, error) {
	if _, ok := posterSizes[size]; !ok {
		return uuid.Nil, "", errors.NewBadRequestError("Invalid size", nil)
	}

	if err := s.imageService.ValidateMultipartImage(file, fileHeader); err != nil {
		return uuid.Nil, "", err
	}

	extension := filepath.Ext(fileHeader.Filename)
	return s.uploadPosterForPreview(ctx, userId, size, file, extension)
}

func (s *posterService) EmbedPosterForPreview(ctx context.Context, userId uuid.UUID, size, embeddedUrl string) (uuid.UUID, string, error) {
	if _, ok := posterSizes[size]; !ok {
		return uuid.Nil, "", errors.NewBadRequestError("Invalid size", nil)
	}

	// download the file from the URL
	fileBytes, extension, err := s.imageService.DownloadAndValidateImageFile(ctx, embeddedUrl)
	if err != nil {
		return uuid.Nil, "", err
	}

	fileReader := bytes.NewReader(fileBytes)
	return s.uploadPosterForPreview(ctx, userId, size, fileReader, extension)
}

func (s *posterService) GetLatestPosterPreviewByUserId(ctx context.Context, userId uuid.UUID) ([]*db.PosterPreview, error) {
	timeAgo := time.Now().Add(config.GetPosterPreviewStoreTime())
	posterPreviews, err := s.sqlDB.Queries().FindPosterPreviewByCreatedAtAfterAndCreatedBy(ctx, db.FindPosterPreviewByCreatedAtAfterAndCreatedByParams{
		CreatedBy: userId,
		CreatedAt: timeAgo,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred getting poster preview", err)
	}
	return posterPreviews, nil
}

func (s *posterService) ConfirmS3PosterPreviewByID(ctx context.Context, id uuid.UUID, prefix string) (*string, error) {
	posterPreview, err := s.GetPosterPreviewByID(ctx, id)
	if err != nil {
		return nil, err
	}

	bucketName := config.GetContentPosterBucketName()
	previewKey := "preview/" + posterPreview.ObjectKey
	finalKey := fmt.Sprintf("%s/%s", prefix, posterPreview.ObjectKey)

	err = s.s3.MoveObject(ctx, bucketName, bucketName, previewKey, finalKey)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred getting preview avatar", err)
	}

	return &posterPreview.ObjectKey, nil
}

func (service *posterService) GetPosterImageURL(ctx context.Context, prefix, size, imageKey string, cbTime time.Time) (string, error) {
	if _, ok := posterSizes[size]; !ok {
		return "", errors.NewBadRequestError("Invalid poster size", nil)
	}

	cacheKey := fmt.Sprintf("poster:%s:%s:%s", prefix, imageKey, size)
	cachedUrl, err := service.cache.GetKey(ctx, cacheKey)
	if err != nil {
		logger.Errorf(ctx, "Error occurred getting poster image URL from cache: %v", err)
	} else if cachedUrl != nil {
		return *cachedUrl, nil
	}

	bucket := config.GetContentPosterBucketName()
	dims := posterSizes[size]
	key := fmt.Sprintf("%s/%s", prefix, imageKey)
	imageUrl, err := service.imageService.GetResizedImageUrlFromS3(bucket, key, dims[0], dims[1], &cbTime)
	if err != nil {
		return "", err
	}

	expiration := config.GetPosterPreviewStoreTime()
	if err := service.cache.SetKey(ctx, cacheKey, imageUrl, expiration); err != nil {
		return "", err
	}
	return imageUrl, nil
}
