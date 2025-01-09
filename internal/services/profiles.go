package services

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

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
	sqlDb    *storage.SQLDatabase
	s3Client *s3.Client
}

func NewProfileService(sqlDb *storage.SQLDatabase, s3Client *s3.Client) *Profile {
	return &Profile{
		sqlDb:    sqlDb,
		s3Client: s3Client,
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

	// lower the link
	req.Link = strings.ToLower(req.Link)

	// update profile
	updatedProfile, err := service.sqlDb.Queries.UpdateProfileByUserId(ctx, db.UpdateProfileByUserIdParams{
		UserID:   profile.UserID,
		Username: req.Username,
		Link:     strings.ToLower(req.Link),
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
	// Extract name from email before @
	name := strings.Split(email, "@")[0]
	if len(name) < 1 {
		return nil, errors.NewBadRequestError("Invalid email format", nil)
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
		UserID:   userId,
		Username: name,
		Link:     link,
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

	fileName := fmt.Sprintf("%s.%s", userId, "png")

	// Upload the file to S3
	url, err := storage.UploadFileToS3(ctx, config.GetRawAvatarBucketName(), fileName, file, service.s3Client)
	if err != nil {
		return "", errors.NewInternalServerError("Error occurred uploading file", err)
	}

	return url, nil
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
		return fmt.Errorf("Invalid file extension: %s", ext)
	}

	// Check MIME type
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return fmt.Errorf("Failed to read file: %w", err)
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
		return fmt.Errorf("Invalid MIME type: %s", mimeType)
	}

	// Reset file pointer to start (for further processing)
	file.Seek(0, io.SeekStart)

	return nil
}
