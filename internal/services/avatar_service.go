package services

import (
	"context"
	"fmt"
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

type AvatarService interface {
	GetProfileAvatarByUserID(ctx context.Context, userID uuid.UUID) (*db.ProfileAvatar, error)
	CreateProfileAvatarForUser(ctx context.Context, userID uuid.UUID, creatorID *uuid.UUID, avatarUrl *string) (*db.ProfileAvatar, error)
	GetAvatarUrlById(ctx context.Context, userID uuid.UUID, size string) (*string, error)
	UploadAvatarForPreviewById(ctx context.Context, userID uuid.UUID, file multipart.File, fileHeader *multipart.FileHeader, size string) (string, error)
	ConfirmProfileAvatar(ctx context.Context, userID uuid.UUID) error
}

type avatarService struct {
	sqlDb        storage.SQLDatabase
	cache        storage.CacheClient
	s3Client     storage.S3Client
	imageService ImageService
}

func NewAvatarService(sqlDb storage.SQLDatabase, cache storage.CacheClient, s3Client storage.S3Client, imageService ImageService) AvatarService {
	return &avatarService{
		sqlDb:        sqlDb,
		cache:        cache,
		s3Client:     s3Client,
		imageService: imageService,
	}
}

var avatarSizes = map[string]int{"sm": 32, "md": 64, "lg": 128}

func (service *avatarService) GetProfileAvatarByUserID(ctx context.Context, userID uuid.UUID) (*db.ProfileAvatar, error) {
	avatar, err := service.sqlDb.Queries().FindProfileAvatarByUserId(ctx, userID)
	if err == pgx.ErrNoRows {
		return service.CreateProfileAvatarForUser(ctx, userID, nil, nil)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred getting profile avatar", err)
	}
	return avatar, nil
}

func (service *avatarService) CreateProfileAvatarForUser(ctx context.Context, userID uuid.UUID, creatorID *uuid.UUID, avatarUrl *string) (*db.ProfileAvatar, error) {
	avatar, err := service.sqlDb.Queries().InsertProfileAvatar(ctx, db.InsertProfileAvatarParams{
		UserID:    userID,
		CreatedBy: creatorID,
		UpdatedBy: creatorID,
		AvatarUrl: avatarUrl,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred creating profile avatar", err)
	}
	return avatar, nil
}

func (service *avatarService) GetAvatarUrlById(ctx context.Context, userID uuid.UUID, size string) (*string, error) {
	if _, ok := avatarSizes[size]; !ok {
		return nil, errors.NewBadRequestError("Invalid avatar size", nil)
	}

	avatar, err := service.GetProfileAvatarByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("avatar:%s:%s", avatar.UserID, size)
	cachedUrl, err := service.cache.GetKey(ctx, cacheKey)
	if err != nil {
		logger.Errorf(ctx, "Error occurred getting avatar URL from cache: %v", err)
	} else if cachedUrl != nil {
		return cachedUrl, nil
	}

	if avatar.AvatarUrl == nil {
		return nil, nil
	}

	dimensions := avatarSizes[size]
	url, err := service.imageService.GetResizedImageUrl(*avatar.AvatarUrl, dimensions, dimensions, &avatar.UpdatedAt)
	if err != nil {
		return nil, err
	}

	err = service.cache.SetKey(ctx, cacheKey, url, time.Hour*24*30)
	if err != nil {
		logger.Errorf(ctx, "Error occurred setting avatar URL to cache: %v", err)
	}

	return &url, nil
}

// Saves the avatar of the user with the given id to S3
func (service *avatarService) UploadAvatarForPreviewById(ctx context.Context, userID uuid.UUID, file multipart.File, fileHeader *multipart.FileHeader, size string) (string, error) {
	if err := service.imageService.ValidateMultipartImage(file, fileHeader); err != nil {
		return "", err
	}

	if _, ok := avatarSizes[size]; !ok {
		return "", errors.NewBadRequestError("Invalid avatar size", nil)
	}

	avatar, err := service.GetProfileAvatarByUserID(ctx, userID)
	if err != nil {
		return "", err
	}

	ext := filepath.Ext(fileHeader.Filename)
	fileName := fmt.Sprintf("%s%s", avatar.UserID, ext)

	bucketName := config.GetAvatarBucketName()
	previewKey := "preview/" + fileName

	// Upload the file to S3
	err = service.s3Client.UploadFileToS3(ctx, bucketName, previewKey, file)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred uploading file", err)
	}

	// update profile
	updatedProfile, err := service.sqlDb.Queries().UpdateProfileAvatarByUserId(ctx, db.UpdateProfileAvatarByUserIdParams{
		UserID:           avatar.UserID,
		UpdatedBy:        &avatar.UserID,
		AvatarPreviewKey: &fileName,
	})
	if err != nil {
		if err1 := service.s3Client.DeleteObject(ctx, bucketName, previewKey); err1 != nil {
			logger.Errorf(ctx, "Error occurred deleting preview avatar: %v", err1)
		}
		return "", errors.NewInternalServerError("Error occurred updating profile", err)
	}

	dims := avatarSizes[size]
	imageUrl, err := service.imageService.GetResizedImageUrlFromS3(bucketName, previewKey, dims, dims, &updatedProfile.UpdatedAt)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred getting profile avatar URL", err)
	}

	return imageUrl, nil
}

func (service *avatarService) ConfirmProfileAvatar(ctx context.Context, userID uuid.UUID) error {
	avatar, err := service.GetProfileAvatarByUserID(ctx, userID)
	if err != nil {
		return err
	}

	// nothing to confirm
	if avatar.AvatarPreviewKey == nil {
		return nil
	}

	bucketName := config.GetAvatarBucketName()
	key := *avatar.AvatarPreviewKey
	previewKey := "preview/" + key

	err = service.s3Client.MoveObject(ctx, bucketName, bucketName, previewKey, key)
	if err != nil {
		return errors.NewInternalServerError("Error occurred getting preview avatar", err)
	}

	avatarUrl := avatar.AvatarUrl
	url := fmt.Sprintf("s3://%s/%s", bucketName, key)

	if avatarUrl != nil && avatarUrl != &url {
		err = service.s3Client.DeleteObject(ctx, bucketName, *avatarUrl)
		if err != nil {
			logger.Errorf(ctx, "Error occurred deleting preview avatar: %v", err)
		}
	}

	for size := range avatarSizes {
		cacheKey := fmt.Sprintf("avatar:%s:%s", avatar.UserID, size)
		err = service.cache.DeleteKey(ctx, cacheKey)
		if err != nil {
			logger.Errorf(ctx, "Error occurred deleting avatar URL from cache: %v", err)
		}
	}

	_, err = service.sqlDb.Queries().UpdateProfileAvatarByUserId(ctx, db.UpdateProfileAvatarByUserIdParams{
		UserID:           avatar.UserID,
		UpdatedBy:        &avatar.UserID,
		AvatarKey:        &key,
		AvatarUrl:        &url,
		AvatarPreviewKey: nil,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred updating profile avatar", err)
	}

	return nil
}
