package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	petname "github.com/dustinkirkland/golang-petname"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/config"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
)

type Profile struct {
	sqlDb        *storage.SQLDatabase
	s3Client     *s3.Client
	imageService *Image
}

func NewProfileService(sqlDb *storage.SQLDatabase, s3Client *s3.Client, imageService *Image) *Profile {
	return &Profile{
		sqlDb:        sqlDb,
		s3Client:     s3Client,
		imageService: imageService,
	}
}

// Return not null models.User or CustomError
func (service *Profile) GetProfileById(ctx context.Context, userId uuid.UUID) (*db.Profile, error) {
	user, err := service.sqlDb.Queries.FindProfileById(ctx, userId)
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during looking for a profile by id", err)
	}

	return user, nil
}

// Return not null models.User or CustomError
func (service *Profile) GetProfileByLink(ctx context.Context, userLink string) (*db.Profile, error) {
	user, err := service.sqlDb.Queries.FindProfileByLink(ctx, strings.ToLower(userLink))
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

func (service *Profile) ValidateLink(ctx context.Context, link string) error {
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
	_, err := service.sqlDb.Queries.FindProfileByLink(ctx, link)
	if err != nil && err != pgx.ErrNoRows {
		return errors.NewInternalServerError("Error occurred looking for a profile by link", err)
	} else if err == nil {
		return errors.NewBadRequestError("Already taken", nil)
	}

	return nil
}

func (service *Profile) UpdateProfile(ctx context.Context, userId uuid.UUID, req *types.UpdateProfileReq) (*db.Profile, error) {
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

	if profile.AvatarPreviewKey != nil {
		newBucketName := config.GetAvatarBucketName()
		key := *profile.AvatarPreviewKey

		err := storage.MoveS3File(ctx, config.GetPreviewAvatarBucketName(), newBucketName, key, key, service.s3Client)
		if err != nil {
			return nil, errors.NewInternalServerError("Error occurred getting preview avatar", err)
		}

		url := fmt.Sprintf("s3://%s/%s", newBucketName, key)

		if avatarUrl != nil && avatarUrl != &url {
			_, err = service.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String(newBucketName),
				Key:    aws.String(*avatarUrl),
			})
			if err != nil {
				log.Printf("Error occurred deleting preview avatar: %v", err)
			}
		}

		avatarUrl = &url
	}

	// lower the link
	req.Link = strings.ToLower(req.Link)

	description := profile.Description
	if len(req.Description) < 500 {
		description = &req.Description
	}

	// update profile
	updatedProfile, err := service.sqlDb.Queries.UpdateProfileByUserId(ctx, db.UpdateProfileByUserIdParams{
		UserID:           profile.UserID,
		UpdatedBy:        &profile.UserID,
		Username:         req.Username,
		Link:             strings.ToLower(req.Link),
		Description:      description,
		AvatarUrl:        avatarUrl,
		AvatarPreviewKey: nil,
	})
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred updating profile", err)
	}

	return updatedProfile, nil
}

func (service *Profile) CreateProfileWebhook(ctx context.Context, req *types.SupabaseWebhookPayload) (*db.Profile, error) {
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

	if rawMetadata, ok := (*req.Record)["raw_user_meta_data"]; !ok {
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

	createdProfile, err := service.sqlDb.Queries.InsertProfile(ctx, db.InsertProfileParams{
		UserID:    userId,
		Username:  name,
		Link:      link,
		AvatarUrl: avatarUrl,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred creating a profile", err)
	}

	return createdProfile, nil

}

// Saves the avatar of the user with the given id to S3
func (service *Profile) UploadAvatar(ctx context.Context, userId uuid.UUID, file multipart.File, fileHeader *multipart.FileHeader) (string, error) {
	if err := validateFile(file, fileHeader); err != nil {
		return "", errors.NewBadRequestError("Invalid file", err)
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

	bucketName := config.GetPreviewAvatarBucketName()

	// Upload the file to S3
	previewAvatarUrl, err := storage.UploadFileToS3(ctx, bucketName, fileName, file, service.s3Client)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred uploading file", err)
	}

	// update profile
	err = service.sqlDb.Queries.UpdateProfilePreviewAvatarByUserId(ctx, db.UpdateProfilePreviewAvatarByUserIdParams{
		UserID:           profile.UserID,
		UpdatedBy:        &profile.UserID,
		AvatarPreviewKey: &previewAvatarUrl,
	})
	if err != nil {
		_, err1 := service.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String(bucketName),
			Key:    aws.String(fileName),
		})
		if err1 != nil {
			return "", errors.NewInternalServerError("Error occurred deleting file", err1)
		}

		return "", errors.NewInternalServerError("Error occurred updating profile", err)
	}

	imageUrl, err := service.imageService.GetResizedImageUrlFromS3(bucketName, previewAvatarUrl, 100, 100)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred getting profile avatar URL", err)
	}

	return imageUrl, nil
}

var allowedExtensions = []string{
	".png",
	".jpg",
	".jpeg",
	".gif",
	".bmp",
	".webp",
}
var allowedMimeTypes = []string{
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
}

func validateFile(file multipart.File, fileHeader *multipart.FileHeader) error {
	if fileHeader.Size > 5*1024*1024 { // 5MB limit
		return errors.NewBadRequestError("File size exceeds 5MB", nil)
	}

	// Check file extension
	ext := filepath.Ext(fileHeader.Filename)

	isAllowed := false
	for _, allowedExt := range allowedExtensions {
		if ext == allowedExt {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		return errors.NewBadRequestError("Invalid file extension: "+ext, nil)
	}

	// Check MIME type
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return errors.NewBadRequestError("Failed to read file", err)
	}

	mimeType := http.DetectContentType(buffer)

	isAllowedMimeType := false
	for _, allowedMimeType := range allowedMimeTypes {
		if mimeType == allowedMimeType {
			isAllowedMimeType = true
			break
		}
	}

	if !isAllowedMimeType {
		return errors.NewBadRequestError("Invalid MIME type: "+mimeType, nil)
	}

	fileExtension := ext[1:]
	if mimeType == "image/jpeg" && fileExtension == "jpg" {
		fileExtension = "jpeg"
	}

	if !strings.HasSuffix(mimeType, fileExtension) {
		return errors.NewBadRequestError("MIME type "+mimeType+" does not match file extension "+ext[1:], nil)
	}

	// Reset file pointer to start (for further processing)
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return errors.NewBadRequestError("Failed to reset file pointer: %w", err)
	}

	return nil
}

var avatarSizes = map[string]int{"sm": 32, "md": 64, "lg": 128}

func (service *Profile) GetAvatarUrlById(ctx context.Context, userId uuid.UUID, size string) (*string, error) {
	profile, err := service.GetProfileById(ctx, userId)
	if err != nil {
		return nil, err
	}

	if profile.AvatarUrl == nil {
		return nil, nil
	}

	if _, ok := avatarSizes[size]; !ok {
		return nil, errors.NewBadRequestError("Invalid size", nil)
	}

	dimensions := avatarSizes[size]

	url, err := service.imageService.GetResizedImageUrl(*profile.AvatarUrl, dimensions, dimensions)
	if err != nil {
		return nil, err
	}
	return &url, nil
}
