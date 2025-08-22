package services

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/singleflight"
)

type AvatarService interface {
	GetAvatarByUserID(ctx context.Context, userID uuid.UUID) (*domain.UserAvatar, error)
	CreateAvatarForUser(ctx context.Context, userID uuid.UUID, creatorID *uuid.UUID, avatarUrl *string) (*domain.UserAvatar, error)
	GetAvatarURLByUserID(ctx context.Context, userID uuid.UUID, size domain.AvatarSize) (string, error)
	UploadAvatarForPreviewByID(ctx context.Context, cmd *commands.UploadAvatarForPreviewCommand) (string, error)
	ConfirmAvatarByUserID(ctx context.Context, userID uuid.UUID) error
}

type avatarService struct {
	sqlDb        storage.RelationalStorage
	cache        storage.CacheStorage
	s3Client     storage.FileStorage
	imageService ImageService
	sfGroup      singleflight.Group
}

func NewAvatarService(
	sqlDb storage.RelationalStorage,
	cache storage.CacheStorage,
	s3Client storage.FileStorage,
	imageService ImageService,
) AvatarService {
	return &avatarService{
		sqlDb:        sqlDb,
		cache:        cache,
		s3Client:     s3Client,
		imageService: imageService,
		sfGroup:      singleflight.Group{},
	}
}

func (s *avatarService) GetAvatarByUserID(ctx context.Context, userID uuid.UUID) (*domain.UserAvatar, error) {
	avatar, err := s.sqlDb.Queries().FindUserAvatarByUserID(ctx, userID)
	if err == pgx.ErrNoRows {
		return s.CreateAvatarForUser(ctx, userID, nil, nil)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to get profile avatar", err)
	}
	return avatar, nil
}

func (s *avatarService) CreateAvatarForUser(ctx context.Context, userID uuid.UUID, creatorID *uuid.UUID, avatarUrl *string) (*domain.UserAvatar, error) {
	avatar, err := s.sqlDb.Queries().InsertUserAvatar(ctx, sql.InsertUserAvatarParams{
		UserID:    userID,
		CreatedBy: creatorID,
		UpdatedBy: creatorID,
		AvatarUrl: avatarUrl,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to create profile avatar", err)
	}
	return avatar, nil
}

func (s *avatarService) GetAvatarURLByUserID(ctx context.Context, userID uuid.UUID, size domain.AvatarSize) (string, error) {
	if _, ok := domain.AvatarSizes[size]; !ok {
		return "", utils.NewBadRequestError("invalid avatar size", nil)
	}

	cacheKey := fmt.Sprintf("avatar:%s:%s", userID, size)
	cachedUrl, err := s.cache.GetKey(ctx, cacheKey)
	if err == nil {
		return cachedUrl, nil
	}

	value, err, _ := s.sfGroup.Do(cacheKey, func() (any, error) {
		url := ""
		defer func() {
			_ = s.cache.SetKey(ctx, cacheKey, url, time.Hour*24*30)
		}()

		avatar, err := s.GetAvatarByUserID(ctx, userID)
		if err != nil {
			return url, err
		}

		if avatar.AvatarUrl == nil {
			return url, nil
		}

		dimensions := domain.AvatarSizes[size]
		url, err = s.imageService.GetResizedImageUrl(*avatar.AvatarUrl, dimensions, dimensions, &avatar.UpdatedAt)
		if err != nil {
			return url, err
		}
		return url, nil
	})
	if err != nil {
		return "", err
	}

	url := value.(string)
	return url, nil
}

// Saves the avatar of the user with the given id to S3
func (s *avatarService) UploadAvatarForPreviewByID(ctx context.Context, cmd *commands.UploadAvatarForPreviewCommand) (string, error) {
	userID := cmd.UserID
	file := cmd.File
	fileHeader := cmd.FileHeader
	size := cmd.AvatarSize

	if err := s.imageService.ValidateMultipartImage(file, fileHeader); err != nil {
		return "", err
	}

	if _, ok := domain.AvatarSizes[size]; !ok {
		return "", utils.NewBadRequestError("Invalid avatar size", nil)
	}

	avatar, err := s.GetAvatarByUserID(ctx, userID)
	if err != nil {
		return "", err
	}

	ext := filepath.Ext(fileHeader.Filename)
	fileName := fmt.Sprintf("%s%s", avatar.UserID, ext)

	bucketName := config.GetAvatarBucketName()
	previewKey := "preview/" + fileName

	// Upload the file to S3
	err = s.s3Client.UploadFile(ctx, bucketName, previewKey, file)
	if err != nil {
		return "", utils.NewInternalServerError("failed to upload file", err)
	}

	// update profile
	updatedAvatar, err := s.sqlDb.Queries().UpdateUserAvatarByUserID(ctx, sql.UpdateUserAvatarByUserIDParams{
		UserID:           avatar.UserID,
		UpdatedBy:        &avatar.UserID,
		AvatarPreviewKey: &fileName,
	})
	if err != nil {
		if err1 := s.s3Client.DeleteObject(ctx, bucketName, previewKey); err1 != nil {
			logger.Errorf(ctx, "failed to delete preview avatar: %v", err1)
		}
		return "", utils.NewInternalServerError("failed to update profile", err)
	}

	dims := domain.AvatarSizes[size]
	imageUrl, err := s.imageService.GetResizedImageUrlFromS3(bucketName, previewKey, dims, dims, &updatedAvatar.UpdatedAt)
	if err != nil {
		return "", utils.NewInternalServerError("failed to get profile avatar URL", err)
	}

	return imageUrl, nil
}

func (s *avatarService) ConfirmAvatarByUserID(ctx context.Context, userID uuid.UUID) error {
	avatar, err := s.GetAvatarByUserID(ctx, userID)
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

	err = s.s3Client.MoveObject(ctx, bucketName, bucketName, previewKey, key)
	if err != nil {
		return utils.NewInternalServerError("failed to get preview avatar", err)
	}

	avatarKey := avatar.AvatarKey
	url := fmt.Sprintf("s3://%s/%s", bucketName, key)

	if avatarKey != nil && avatarKey != &key {
		err = s.s3Client.DeleteObject(ctx, bucketName, *avatarKey)
		if err != nil {
			logger.Errorf(ctx, "failed to delete preview avatar: %v", err)
		}
	}

	for size := range domain.AvatarSizes {
		cacheKey := fmt.Sprintf("avatar:%s:%s", avatar.UserID, size)
		err = s.cache.DeleteKey(ctx, cacheKey)
		if err != nil {
			logger.Errorf(ctx, "failed to delete avatar URL from cache: %v", err)
		}
	}

	_, err = s.sqlDb.Queries().UpdateUserAvatarByUserID(ctx, sql.UpdateUserAvatarByUserIDParams{
		UserID:           avatar.UserID,
		UpdatedBy:        &avatar.UserID,
		AvatarKey:        &key,
		AvatarUrl:        &url,
		AvatarPreviewKey: nil,
	})
	if err != nil {
		return utils.NewInternalServerError("failed to update profile avatar", err)
	}

	return nil
}
