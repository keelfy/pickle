package services

import (
	"context"
	"encoding/json"
	"strings"
	"sync"

	petname "github.com/dustinkirkland/golang-petname"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/singleflight"
)

type ProfileService interface {
	GetProfileById(ctx context.Context, userId uuid.UUID) (*db.Profile, error)
	GetProfileByLink(ctx context.Context, userLink string) (*db.Profile, error)
	GetMyProfile(ctx context.Context, avatarSize string) (*models.PublicProfile, error)
	ValidateLink(ctx context.Context, link string) error
	UpdateProfile(ctx context.Context, userId uuid.UUID, req *types.UpdateProfileReq) error
	UpdateSuggestionPreferences(ctx context.Context, userID uuid.UUID, req *models.SuggestionPreferences) error
	ParseSuggestionPreferences(ctx context.Context, profile *db.Profile) (*models.SuggestionPreferences, error)
	CreateProfileWebhook(ctx context.Context, req *types.SupabaseWebhookPayload) (*db.Profile, error)
}

type profileService struct {
	sqlDb           storage.RelationalStorage
	s3Client        storage.FileStorage
	cache           storage.CacheStorage
	avatarService   AvatarService
	group           singleflight.Group
	followerService FollowerService
	ordererService  OrdererService
}

func NewProfileService(sqlDb storage.RelationalStorage, s3Client storage.FileStorage, cache storage.CacheStorage,
	avatarService AvatarService, followerService FollowerService, ordererService OrdererService,
) ProfileService {
	return &profileService{
		sqlDb:           sqlDb,
		s3Client:        s3Client,
		cache:           cache,
		avatarService:   avatarService,
		group:           singleflight.Group{},
		followerService: followerService,
	}
}

func (service *profileService) GetProfileById(ctx context.Context, userId uuid.UUID) (*db.Profile, error) {
	user, err := service.sqlDb.Queries().FindProfileById(ctx, userId)
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during looking for a profile by id", err)
	}
	return user, nil
}

func (service *profileService) GetProfileByLink(ctx context.Context, userLink string) (*db.Profile, error) {
	user, err := service.sqlDb.Queries().FindProfileByLink(ctx, strings.ToLower(userLink))
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during looking for a profile by link", err)
	}

	return user, nil
}

func (service *profileService) GetMyProfile(ctx context.Context, avatarSize string) (*models.PublicProfile, error) {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return nil, err
	}

	profile, err := service.GetProfileById(ctx, authUserID)
	if err != nil {
		return nil, err
	}

	publicProfile := &models.PublicProfile{
		ID:           profile.UserID,
		Username:     profile.Username,
		Link:         profile.Link,
		Description:  profile.Description,
		IsFollowing:  authUserID == profile.UserID,
		IsAuthorized: authUserID == profile.UserID,
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		suggestionPreferences, err := service.ParseSuggestionPreferences(ctx, profile)
		if err != nil {
			logger.Errorf(ctx, "Error occurred during parsing suggestion preferences: %v", err)
		}
		publicProfile.SuggestionPreferences = suggestionPreferences
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		avatarUrl, err := service.avatarService.GetAvatarUrlById(ctx, profile.UserID, avatarSize)
		if err != nil {
			logger.Errorf(ctx, "Error occurred during avatar url: %v", err)
		}
		publicProfile.AvatarURL = avatarUrl
	}()

	wg.Wait()

	return publicProfile, nil
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

func (service *profileService) UpdateProfile(ctx context.Context, userId uuid.UUID, req *types.UpdateProfileReq) error {
	profile, err := service.GetProfileById(ctx, userId)
	if err != nil {
		return err
	}

	if profile.Link != req.Link {
		err = service.ValidateLink(ctx, req.Link)
		if err != nil {
			return err
		}
	}

	err = service.avatarService.ConfirmProfileAvatar(ctx, userId)
	if err != nil {
		return err
	}

	req.Link = strings.ToLower(req.Link)

	description := profile.Description
	if len(req.Description) < 500 {
		description = req.Description
	}

	tx, err := service.sqlDb.Begin(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during transaction creation", err)
	}
	defer tx.Rollback(ctx)
	qtx := service.sqlDb.Queries().WithTx(tx)

	err = qtx.UpdateProfileByUserId(ctx, db.UpdateProfileByUserIdParams{
		UserID:      profile.UserID,
		UpdatedBy:   profile.UserID,
		Username:    req.Username,
		Link:        strings.ToLower(req.Link),
		Description: description,
	})
	if err == pgx.ErrNoRows {
		return errors.NewNotFoundError("Profile not found", err)
	} else if err != nil {
		return errors.NewInternalServerError("Error occurred updating profile", err)
	}

	if profile.Username != req.Username {
		err = service.ordererService.UpdateOrdererUsernameByUserIDWithTx(ctx, qtx, profile)
		if err != nil {
			return err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during transaction commit", err)
	}
	return nil
}

func (service *profileService) ParseSuggestionPreferences(ctx context.Context, profile *db.Profile) (*models.SuggestionPreferences, error) {
	suggestionPreferences := &models.SuggestionPreferences{
		Enabled:            false,
		AllowedFree:        true,
		AllowedAnonymously: true,
		Categories: []db.ContentCategory{
			db.ContentCategoryGames,
			db.ContentCategoryMovies,
			db.ContentCategoryAnime,
			db.ContentCategoryVideo,
			db.ContentCategorySeries,
		},
	}
	if profile.SuggestionPreferences != nil {
		err := json.Unmarshal(profile.SuggestionPreferences, suggestionPreferences)
		if err != nil {
			logger.Errorf(ctx, "Error occurred during unmarshalling suggestion preferences: %v", err)
		}
	}
	return suggestionPreferences, nil
}

func (service *profileService) UpdateSuggestionPreferences(ctx context.Context, userID uuid.UUID, req *models.SuggestionPreferences) error {
	authUserID, err := utils.UserIdFromContext(ctx)
	if err != nil {
		return err
	}

	jsonb, err := json.Marshal(req)
	if err != nil {
		return errors.NewInternalServerError("Error occurred marshalling suggestion preferences", err)
	}

	// validate suggestion preferences
	if req.Enabled && len(req.Categories) == 0 {
		return errors.NewBadRequestError("At least one category is required", nil)
	}

	if authUserID != userID {
		return errors.NewBadRequestError("You are not allowed to update suggestion preferences for this profile", nil)
	}

	profile, err := service.GetProfileById(ctx, userID)
	if err != nil {
		return err
	}

	err = service.sqlDb.Queries().UpdateProfileSuggestionPreferences(ctx, db.UpdateProfileSuggestionPreferencesParams{
		UserID:                profile.UserID,
		UpdatedBy:             authUserID,
		SuggestionPreferences: jsonb,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred updating suggestion preferences", err)
	}
	return nil
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

	suggestionPreferences := &models.SuggestionPreferences{
		Enabled:            false,
		AllowedFree:        true,
		AllowedAnonymously: true,
		Categories: []db.ContentCategory{
			db.ContentCategoryGames,
			db.ContentCategoryMovies,
			db.ContentCategoryAnime,
			db.ContentCategoryVideo,
			db.ContentCategorySeries,
		},
	}
	jsonb, err := json.Marshal(suggestionPreferences)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred marshalling suggestion preferences", err)
	}

	createdProfile, err := service.sqlDb.Queries().InsertProfile(ctx, db.InsertProfileParams{
		UserID:                userId,
		Username:              name,
		Description:           "",
		Link:                  link,
		SuggestionPreferences: jsonb,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred creating a profile", err)
	}

	_, err = service.avatarService.CreateProfileAvatarForUser(ctx, userId, nil, avatarUrl)
	if err != nil {
		return nil, err
	}

	return createdProfile, nil

}
