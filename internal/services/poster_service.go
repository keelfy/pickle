package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/config"
	cerrors "github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage"
)

type PosterService interface {
	GetPosterPreviewByID(ctx context.Context, id uuid.UUID) (*db.PosterPreview, error)
	GetPosterPreviews(ctx context.Context, userId uuid.UUID) ([]*db.PosterPreview, error)
	UploadPosterForPreview(ctx context.Context, userId uuid.UUID, size string, file multipart.File, fileHeader *multipart.FileHeader) (uuid.UUID, string, error)
	EmbedPosterForPreview(ctx context.Context, userId uuid.UUID, size, embeddedUrl string) (uuid.UUID, string, error)
	GetLatestPosterPreviewByUserId(ctx context.Context, userId uuid.UUID) ([]*db.PosterPreview, error)
	ConfirmS3PosterPreviewByID(ctx context.Context, id uuid.UUID, prefix string) (*string, error)

	GetCoverImageURL(ctx context.Context, size, imageKey string, imageType db.ImageKeyType) (string, error)
	GetContentThumbnailImageURL(ctx context.Context, size, imageKey string, imageType db.ImageKeyType) (string, error)

	GetPosterImageURL(ctx context.Context, prefix, size, imageKey string, cbTime *time.Time) (string, error)
	GetPosterPreviewImageURL(ctx context.Context, id uuid.UUID, size string) (string, error)
	DeletePosterKey(ctx context.Context, prefix, posterKey string) error
	DeletePosterPreview(ctx context.Context, id uuid.UUID, userId uuid.UUID) error
}

type posterService struct {
	sqlDB          storage.RelationalStorage
	s3             storage.FileStorage
	cache          storage.CacheStorage
	imageService   ImageService
	profileService ProfileService
}

func NewPosterService(
	sqlDB storage.RelationalStorage, s3 storage.FileStorage, cache storage.CacheStorage,
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

var coverDimensions = map[string][]int{
	"sm": {108, 144},
	"md": {168, 224},
	"lg": {336, 448},
}

var thumbnailDimensions = map[string][]int{
	"sm": {35, 35},
	"md": {90, 90},
}

var igdbImageURLFormat = config.GetIGDBImageURLFormat()

func (s *posterService) GetPosterPreviewByID(ctx context.Context, id uuid.UUID) (*db.PosterPreview, error) {
	posterPreview, err := s.sqlDB.Queries().FindPosterPreviewById(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, cerrors.NewBadRequestError("Poster preview not found", err)
	} else if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred getting poster preview", err)
	}
	return posterPreview, nil
}

func (s *posterService) GetPosterPreviews(ctx context.Context, userId uuid.UUID) ([]*db.PosterPreview, error) {
	posterPreviews, err := s.sqlDB.Queries().FindPosterPreviewByCreatedAtAfterAndCreatedBy(ctx, db.FindPosterPreviewByCreatedAtAfterAndCreatedByParams{
		CreatedBy: userId,
		CreatedAt: time.Now().Add(-config.GetPosterPreviewStoreTime()),
		Limit:     int32(5),
	})
	if err != nil {
		return nil, cerrors.NewInternalServerError("Error occurred getting poster previews", err)
	}
	return posterPreviews, nil
}

func (s *posterService) uploadPosterForPreview(ctx context.Context, userId uuid.UUID, size string, fileReader io.Reader, fileExtension string) (uuid.UUID, string, error) {
	if _, ok := coverDimensions[size]; !ok {
		return uuid.Nil, "", cerrors.NewBadRequestError("Invalid size", nil)
	}

	profile, err := s.profileService.GetProfileByID(ctx, userId)
	if err != nil {
		return uuid.Nil, "", err
	}

	if profile == nil {
		return uuid.Nil, "", cerrors.NewBadRequestError("Profile not found", nil)
	}

	posterPreviewId := uuid.New()
	objectKey := fmt.Sprintf("%s%s", posterPreviewId, fileExtension)

	bucketName := config.GetContentPosterBucketName()
	previewKey := "preview/" + objectKey

	// Upload the file to S3
	err = s.s3.UploadFile(ctx, bucketName, previewKey, fileReader)
	if err != nil {
		return uuid.Nil, "", cerrors.NewInternalServerError("Error occurred uploading file", err)
	}

	posterPreview, err := s.sqlDB.Queries().InsertPosterPreview(ctx, db.InsertPosterPreviewParams{
		ID:        posterPreviewId,
		CreatedBy: userId,
		ObjectKey: objectKey,
	})
	if err != nil {
		if err1 := s.s3.DeleteObject(ctx, bucketName, previewKey); err1 != nil {
			logger.Errorf(ctx, "Error occurred deleting preview avatar: %v", err1)
		}
		return uuid.Nil, "", cerrors.NewInternalServerError("Error occurred inserting poster preview", err)
	}

	// delete previews if more than 5 or older than 1 day

	existingPreviews, err := s.sqlDB.Queries().FindPosterPreviewByCreatedBy(ctx, profile.UserID)
	if err != nil {
		logger.Errorf(ctx, "Error occurred getting poster previews: %v", err)
	}

	keysToDelete := make([]string, 0)

	for index, preview := range existingPreviews {
		if preview.ObjectKey == objectKey {
			continue
		}

		if index > 5 || preview.CreatedAt.Before(time.Now().Add(-config.GetPosterPreviewStoreTime())) {
			key := fmt.Sprintf("preview/%s", preview.ObjectKey)
			keysToDelete = append(keysToDelete, key)
		}
	}

	if len(keysToDelete) > 0 {
		_ = s.s3.BulkDeleteObject(ctx, bucketName, keysToDelete)
	}

	// generate imgproxy URL for preview

	imageUrl, err := s.GetPosterImageURL(ctx, "preview", size, objectKey, &posterPreview.CreatedAt)
	if err != nil {
		return uuid.Nil, "", cerrors.NewInternalServerError("Error occurred getting poster preview URL", err)
	}

	return posterPreviewId, imageUrl, nil
}

func (s *posterService) UploadPosterForPreview(ctx context.Context, userId uuid.UUID, size string, file multipart.File, fileHeader *multipart.FileHeader) (uuid.UUID, string, error) {
	if _, ok := coverDimensions[size]; !ok {
		return uuid.Nil, "", cerrors.NewBadRequestError("Invalid size", nil)
	}

	if err := s.imageService.ValidateMultipartImage(file, fileHeader); err != nil {
		return uuid.Nil, "", err
	}

	extension := filepath.Ext(fileHeader.Filename)
	return s.uploadPosterForPreview(ctx, userId, size, file, extension)
}

func (s *posterService) EmbedPosterForPreview(ctx context.Context, userId uuid.UUID, size, embeddedUrl string) (uuid.UUID, string, error) {
	if _, ok := coverDimensions[size]; !ok {
		return uuid.Nil, "", cerrors.NewBadRequestError("Invalid size", nil)
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
		return nil, cerrors.NewInternalServerError("Error occurred getting poster preview", err)
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
		return nil, cerrors.NewInternalServerError("Error occurred getting preview avatar", err)
	}

	return &posterPreview.ObjectKey, nil
}

func (service *posterService) getContentCategoryPrefix(contentType db.ContentCategory) (string, error) {
	switch contentType {
	case db.ContentCategoryGames:
		return "game-note", nil
	case db.ContentCategoryMovies:
		return "movie-note", nil
	case db.ContentCategoryAnime:
		return "anime-note", nil
	case db.ContentCategorySeries:
		return "series-note", nil
	case db.ContentCategoryVideo:
		return "video-note", nil
	}
	return "", errors.New("invalid content type")
}

func (s *posterService) GetCoverImageURL(ctx context.Context, size, imageKey string, imageType db.ImageKeyType) (string, error) {
	if _, ok := coverDimensions[size]; !ok {
		return "", cerrors.NewBadRequestError("Invalid poster size", nil)
	}

	switch imageType {
	case db.ImageKeyTypeCustom:
		prefix, err := s.getContentCategoryPrefix(db.ContentCategoryGames)
		if err != nil {
			return "", err
		}
		return s.GetPosterImageURL(ctx, prefix, size, imageKey, nil)
	case db.ImageKeyTypeIgdb:
		dims := coverDimensions[size]
		imageUrl := fmt.Sprintf(igdbImageURLFormat, "cover_big", imageKey)
		resizedImageUrl, err := s.imageService.GetResizedImageUrl(imageUrl, dims[0], dims[1], nil)
		if err != nil {
			return "", err
		}

		cacheKey := fmt.Sprintf("igdb_cover:%s:%s", imageKey, size)
		expiration := config.GetPosterPreviewStoreTime()
		if err := s.cache.SetKey(ctx, cacheKey, resizedImageUrl, expiration); err != nil {
			return "", err
		}
		return resizedImageUrl, nil
	case db.ImageKeyTypeTmdb:
		dims := coverDimensions[size]
		imageUrl := fmt.Sprintf("%s/w342%s", config.GetTMDBImageBaseURL(), imageKey)
		resizedImageUrl, err := s.imageService.GetResizedImageUrl(imageUrl, dims[0], dims[1], nil)
		if err != nil {
			return "", err
		}

		cacheKey := fmt.Sprintf("tmdb_cover:%s:%s", imageKey, size)
		expiration := config.GetPosterPreviewStoreTime()
		if err := s.cache.SetKey(ctx, cacheKey, resizedImageUrl, expiration); err != nil {
			return "", err
		}
		return resizedImageUrl, nil
	default:
		return "", cerrors.NewBadRequestError("Unsupported cover image type", nil)
	}
}

func (s *posterService) GetContentThumbnailImageURL(ctx context.Context, size, imageKey string, imageType db.ImageKeyType) (string, error) {
	if _, ok := thumbnailDimensions[size]; !ok {
		return "", cerrors.NewBadRequestError("Invalid poster size", nil)
	}

	switch imageType {
	case db.ImageKeyTypeIgdb:
		igdbSize := "micro"
		if size == "md" {
			igdbSize = "thumb"
		}
		imageUrl := fmt.Sprintf(igdbImageURLFormat, igdbSize, imageKey)
		return imageUrl, nil
	case db.ImageKeyTypeTmdb:
		tmdbSize := "w45"
		if size == "md" {
			tmdbSize = "w92"
		}
		imageUrl := fmt.Sprintf("%s/%s%s", config.GetTMDBImageBaseURL(), tmdbSize, imageKey)
		return imageUrl, nil
	default:
		return "", cerrors.NewBadRequestError("Unsupported cover image type", nil)
	}
}

func (service *posterService) GetPosterImageURL(ctx context.Context, prefix, size, imageKey string, cbTime *time.Time) (string, error) {
	if _, ok := coverDimensions[size]; !ok {
		return "", cerrors.NewBadRequestError("Invalid poster size", nil)
	}

	cacheKey := fmt.Sprintf("poster:%s:%s:%s", prefix, imageKey, size)
	cachedUrl, err := service.cache.GetKey(ctx, cacheKey)
	if err == nil {
		return cachedUrl, nil
	}

	bucket := config.GetContentPosterBucketName()
	dims := coverDimensions[size]
	key := fmt.Sprintf("%s/%s", prefix, imageKey)
	imageUrl, err := service.imageService.GetResizedImageUrlFromS3(bucket, key, dims[0], dims[1], cbTime)
	if err != nil {
		return "", err
	}

	expiration := config.GetPosterPreviewStoreTime()
	if err := service.cache.SetKey(ctx, cacheKey, imageUrl, expiration); err != nil {
		return "", err
	}
	return imageUrl, nil
}

func (s *posterService) GetPosterPreviewImageURL(ctx context.Context, id uuid.UUID, size string) (string, error) {
	posterPreview, err := s.GetPosterPreviewByID(ctx, id)
	if err != nil {
		return "", err
	}

	return s.GetPosterImageURL(ctx, "preview", size, posterPreview.ObjectKey, &posterPreview.CreatedAt)
}

func (s *posterService) DeletePosterKey(ctx context.Context, prefix, posterKey string) error {
	bucketName := config.GetContentPosterBucketName()
	key := fmt.Sprintf("%s/%s", prefix, posterKey)

	err := s.s3.DeleteObject(ctx, bucketName, key)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred deleting previous poster", err)
	}

	for sizeName := range coverDimensions {
		cacheKey := fmt.Sprintf("poster:%s:%s:%s", prefix, posterKey, sizeName)
		err = s.cache.DeleteKey(ctx, cacheKey)
		if err != nil {
			logger.Errorf(ctx, "Error occurred deleting poster cache: %v", err)
		}
	}

	return nil
}

func (s *posterService) DeletePosterPreview(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	posterPreview, err := s.GetPosterPreviewByID(ctx, id)
	if err != nil {
		return err
	}

	if posterPreview.CreatedBy != userID {
		return cerrors.NewForbiddenError("You are not allowed to delete this poster preview", nil)
	}

	bucketName := config.GetContentPosterBucketName()
	previewKey := "preview/" + posterPreview.ObjectKey

	err = s.s3.DeleteObject(ctx, bucketName, previewKey)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred deleting poster preview", err)
	}

	err = s.sqlDB.Queries().DeletePosterPreview(ctx, id)
	if err != nil {
		return cerrors.NewInternalServerError("Error occurred deleting poster preview", err)
	}

	return nil
}
