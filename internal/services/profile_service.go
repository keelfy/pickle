package services

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	petname "github.com/dustinkirkland/golang-petname"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
)

type ProfileService interface {
	GetProfileById(ctx context.Context, userId uuid.UUID) (*db.Profile, error)
	GetProfileByLink(ctx context.Context, userLink string) (*db.Profile, error)
	ValidateLink(ctx context.Context, link string) error
	UpdateProfile(ctx context.Context, userId uuid.UUID, req *types.UpdateProfileReq) (*db.Profile, error)
	CreateProfileWebhook(ctx context.Context, req *types.SupabaseWebhookPayload) (*db.Profile, error)
	UploadAvatarForPreviewById(ctx context.Context, userId uuid.UUID, file multipart.File, fileHeader *multipart.FileHeader) (string, error)
	GetAvatarUrlById(ctx context.Context, userId uuid.UUID, size string) (*string, error)
}

type profileService struct {
	sqlDb        storage.SQLDatabase
	s3Client     storage.S3Client
	cache        storage.CacheClient
	imageService ImageService
	isDebug      bool
}

func NewProfileService(sqlDb storage.SQLDatabase, s3Client storage.S3Client, cache storage.CacheClient, imageService ImageService) ProfileService {
	return &profileService{
		sqlDb:        sqlDb,
		s3Client:     s3Client,
		cache:        cache,
		imageService: imageService,
		isDebug:      config.IsDebug(),
	}
}

// Return not null models.User or CustomError
func (service *profileService) GetProfileById(ctx context.Context, userId uuid.UUID) (*db.Profile, error) {
	user, err := service.sqlDb.Queries().FindProfileById(ctx, userId)
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during looking for a profile by id", err)
	}

	return user, nil
}

// Return not null models.User or CustomError
func (service *profileService) GetProfileByLink(ctx context.Context, userLink string) (*db.Profile, error) {
	user, err := service.sqlDb.Queries().FindProfileByLink(ctx, strings.ToLower(userLink))
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during looking for a profile by link", err)
	}

	return user, nil
}

var restrictedLinks = []string{
	"admin",
	"profile",
	"settings",
	"logout",
	"login",
	"register",
	"forgot-password",
	"reset-password",
	"verify-email",
	"auth",
	"api",
	"dashboard",
}

func (service *profileService) ValidateLink(ctx context.Context, link string) error {
	if len(link) < 1 {
		return errors.NewBadRequestError("Required at least 3 symbols", nil)
	} else if len(link) < 3 {
		return errors.NewBadRequestError("Too short", nil)
	} else if len(link) > 50 {
		return errors.NewBadRequestError("Too long", nil)
	}

	for _, restrictedLink := range restrictedLinks {
		if link == restrictedLink {
			return errors.NewBadRequestError("Is not allowed", nil)
		}
	}

	// only alphanumeric characters and two symbols
	for _, char := range link {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' || char == '_') {
			return errors.NewBadRequestError("Contains invalid characters. Allowed only: a-Z, 0-9, -, _", nil)
		}
	}

	// validate link uniqueness
	_, err := service.sqlDb.Queries().FindProfileByLink(ctx, link)
	if err != nil && err != pgx.ErrNoRows {
		return errors.NewInternalServerError("Error occurred looking for a profile by link", err)
	} else if err == nil {
		return errors.NewBadRequestError("Already taken", nil)
	}

	return nil
}

func (service *profileService) UpdateProfile(ctx context.Context, userId uuid.UUID, req *types.UpdateProfileReq) (*db.Profile, error) {
	profile, err := service.GetProfileById(ctx, userId)
	if err != nil {
		return nil, err
	}

	if profile.Username != req.Username {
		// validate username
		if len(req.Username) < 1 {
			return nil, errors.NewBadRequestError("Username is required", nil)
		} else if len(req.Username) < 3 {
			return nil, errors.NewBadRequestError("Username is too short", nil)
		} else if len(req.Username) > 100 {
			return nil, errors.NewBadRequestError("Username is too long", nil)
		}
	}

	if profile.Link != req.Link {
		err = service.ValidateLink(ctx, req.Link)
		if err != nil {
			return nil, err
		}
	}

	avatarUrl := profile.AvatarUrl
	avatarUrlUpdatedAt := profile.AvatarUrlUpdatedAt

	if profile.AvatarPreviewKey != nil {
		bucketName := config.GetAvatarBucketName()
		key := *profile.AvatarPreviewKey
		previewKey := "preview/" + key

		err := service.s3Client.MoveObject(ctx, bucketName, bucketName, previewKey, key)
		if err != nil {
			return nil, errors.NewInternalServerError("Error occurred getting preview avatar", err)
		}

		url := fmt.Sprintf("s3://%s/%s", bucketName, key)

		if avatarUrl != nil && avatarUrl != &url {
			err = service.s3Client.DeleteObject(ctx, bucketName, *avatarUrl)
			if err != nil {
				logger.Errorf(ctx, "Error occurred deleting preview avatar: %v", err)
			}
		}

		for size := range avatarSizes {
			cacheKey := fmt.Sprintf("avatar:%s:%s", userId, size)
			err = service.cache.DeleteKey(ctx, cacheKey)
			if err != nil {
				logger.Errorf(ctx, "Error occurred deleting avatar URL from cache: %v", err)
			}
		}

		avatarUrl = &url
		avatarUrlUpdatedAt = time.Now()
	}

	// lower the link
	req.Link = strings.ToLower(req.Link)

	description := profile.Description
	if len(req.Description) < 500 {
		description = req.Description
	}

	// update profile
	updatedProfile, err := service.sqlDb.Queries().UpdateProfileByUserId(ctx, db.UpdateProfileByUserIdParams{
		UserID:             profile.UserID,
		UpdatedBy:          &profile.UserID,
		Username:           req.Username,
		Link:               strings.ToLower(req.Link),
		Description:        description,
		AvatarUrl:          avatarUrl,
		AvatarPreviewKey:   nil,
		AvatarUrlUpdatedAt: avatarUrlUpdatedAt,
	})
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred updating profile", err)
	}

	return updatedProfile, nil
}

func (service *profileService) CreateProfileWebhook(ctx context.Context, req *types.SupabaseWebhookPayload) (*db.Profile, error) {
	email := (*req.Record)["email"].(string)
	if len(email) < 1 {
		return nil, errors.NewBadRequestError("Email is required", nil)
	}

	id := (*req.Record)["id"].(string)
	if len(id) < 1 {
		return nil, errors.NewBadRequestError("User ID is required", nil)
	}

	userId, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.NewBadRequestError("Invalid user ID", err)
	}

	var (
		name      string
		avatarUrl *string
	)

	if rawMetadata, ok := (*req.Record)["raw_user_meta_data"]; ok {
		metadata := rawMetadata.(map[string]interface{})

		if rawName, ok := metadata["name"]; ok {
			name = rawName.(string)
		}

		if rawAvatarUrl, ok := metadata["avatar_url"]; ok {
			url := rawAvatarUrl.(string)
			avatarUrl = &url
		}
	}

	if len(name) < 1 {
		// Extract name from email before @
		name = strings.Split(email, "@")[0]
		if len(name) < 1 {
			return nil, errors.NewBadRequestError("Invalid email format", nil)
		}
	}

	// generate random username
	link := strings.ToLower(petname.Generate(2, "-"))

	// Set a limit for the number of attempts to generate a unique link
	const maxAttempts = 10
	attempts := 0

	for {
		err := service.ValidateLink(ctx, link)
		if err == nil {
			break
		}
		if attempts >= maxAttempts {
			link = uuid.New().String()
			break
		}
		link = strings.ToLower(petname.Generate(2, "-"))
		attempts++
	}

	createdProfile, err := service.sqlDb.Queries().InsertProfile(ctx, db.InsertProfileParams{
		UserID:           userId,
		Username:         name,
		Description:      "",
		Link:             link,
		AvatarUrl:        avatarUrl,
		AvatarPreviewKey: nil,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred creating a profile", err)
	}

	return createdProfile, nil

}

// Saves the avatar of the user with the given id to S3
func (service *profileService) UploadAvatarForPreviewById(ctx context.Context, userId uuid.UUID, file multipart.File, fileHeader *multipart.FileHeader) (string, error) {
	if err := service.imageService.ValidateMultipartImage(file, fileHeader); err != nil {
		return "", err
	}

	profile, err := service.GetProfileById(ctx, userId)
	if err != nil {
		return "", err
	}

	if profile == nil {
		return "", errors.NewBadRequestError("Profile not found", nil)
	}

	ext := filepath.Ext(fileHeader.Filename)
	fileName := fmt.Sprintf("%s%s", userId, ext)

	bucketName := config.GetAvatarBucketName()
	previewKey := "preview/" + fileName

	// Upload the file to S3
	err = service.s3Client.UploadFileToS3(ctx, bucketName, previewKey, file)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred uploading file", err)
	}

	// update profile
	profile, err = service.sqlDb.Queries().UpdateProfilePreviewAvatarByUserId(ctx, db.UpdateProfilePreviewAvatarByUserIdParams{
		UserID:           profile.UserID,
		UpdatedBy:        &profile.UserID,
		AvatarPreviewKey: &fileName,
	})
	if err != nil {
		if err1 := service.s3Client.DeleteObject(ctx, bucketName, previewKey); err1 != nil {
			logger.Errorf(ctx, "Error occurred deleting preview avatar: %v", err1)
		}
		return "", errors.NewInternalServerError("Error occurred updating profile", err)
	}

	size := avatarSizes["lg"]
	imageUrl, err := service.imageService.GetResizedImageUrlFromS3(bucketName, previewKey, size, size, &profile.UpdatedAt)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred getting profile avatar URL", err)
	}

	return imageUrl, nil
}

var avatarSizes = map[string]int{"sm": 32, "md": 64, "lg": 128}

func (service *profileService) GetAvatarUrlById(ctx context.Context, userId uuid.UUID, size string) (*string, error) {
	if _, ok := avatarSizes[size]; !ok {
		return nil, errors.NewBadRequestError("Invalid size", nil)
	}

	cacheKey := fmt.Sprintf("avatar:%s:%s", userId, size)
	cachedUrl, err := service.cache.GetKey(ctx, cacheKey)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred getting avatar URL from cache", err)
	}

	if cachedUrl != nil {
		return cachedUrl, nil
	}

	profile, err := service.GetProfileById(ctx, userId)
	if err != nil {
		return nil, err
	}

	if profile.AvatarUrl == nil {
		return nil, nil
	}

	dimensions := avatarSizes[size]

	url, err := service.imageService.GetResizedImageUrl(*profile.AvatarUrl, dimensions, dimensions, &profile.AvatarUrlUpdatedAt)
	if err != nil {
		return nil, err
	}

	err = service.cache.SetKey(ctx, cacheKey, url, time.Hour*24*30)
	if err != nil {
		logger.Errorf(ctx, "Error occurred setting avatar URL to cache: %v", err)
	}

	return &url, nil
}
