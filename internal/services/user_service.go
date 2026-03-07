package services

import (
	"context"
	"encoding/json"
	"slices"
	"strings"

	petname "github.com/dustinkirkland/golang-petname"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	req "github.com/pickle.pw/monolith/internal/transport/http/requests"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type UserService interface {
	GetUserByID(ctx context.Context, userID uuid.UUID) (*domain.DetailedUser, error)
	GetDetailedUserByUsername(ctx context.Context, username string) (*domain.DetailedUser, error)
	ValidateUsername(ctx context.Context, username string) error
	UpdateUser(ctx context.Context, tx sql.Queries, user *domain.DetailedUser, req *commands.UpdateUserCommand) error
	UpdateSuggestionPreferences(ctx context.Context, user *domain.DetailedUser, req *req.UserSuggestionPreferences) error
	CreateUser(ctx context.Context, cmd *commands.CreateUserCommand) (*domain.DetailedUser, error)
}

type userService struct {
	sqlDb           storage.RelationalStorage
	s3Client        storage.FileStorage
	cache           storage.CacheStorage
	avatarService   AvatarService
	followerService FollowerService
	logger          *zap.SugaredLogger
}

func NewUserService(
	sqlDb storage.RelationalStorage,
	s3Client storage.FileStorage,
	cache storage.CacheStorage,
	avatarService AvatarService,
	followerService FollowerService, zapLogger *zap.SugaredLogger,
) UserService {
	return &userService{
		sqlDb:           sqlDb,
		s3Client:        s3Client,
		cache:           cache,
		avatarService:   avatarService,
		followerService: followerService, logger: zapLogger,
	}
}

func (s *userService) GetUserByID(ctx context.Context, userID uuid.UUID) (*domain.DetailedUser, error) {
	user, err := s.sqlDb.Queries().FindProfileByID(ctx, userID)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("profile not found", err)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to find profile by id", err)
	}
	return user, nil
}

func (s *userService) GetDetailedUserByUsername(ctx context.Context, username string) (*domain.DetailedUser, error) {
	user, err := s.sqlDb.Queries().FindDetailedUserByUsername(ctx, strings.ToLower(username))
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("profile not found", err)
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to find profile by username", err)
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
	"discover",
	"following",
	"user",
}

func (s *userService) ValidateUsername(ctx context.Context, username string) error {
	if len(username) < 1 {
		return utils.NewBadRequestError("Required at least 3 symbols", nil)
	} else if len(username) < 3 {
		return utils.NewBadRequestError("Too short", nil)
	} else if len(username) > 50 {
		return utils.NewBadRequestError("Too long", nil)
	}

	if slices.Contains(restrictedLinks, username) {
		return utils.NewBadRequestError("Username is not allowed", nil)
	}

	// only alphanumeric characters and two symbols
	for _, char := range username {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' || char == '_') {
			return utils.NewBadRequestError("Contains invalid characters. Allowed only: a-Z, 0-9, -, _", nil)
		}
	}

	// validate link uniqueness
	_, err := s.sqlDb.Queries().FindUserByUsername(ctx, username)
	if err != nil && err != pgx.ErrNoRows {
		return utils.NewInternalServerError("failed to find profile by username", err)
	} else if err == nil {
		return utils.NewBadRequestError("Already taken", nil)
	}

	return nil
}

func (s *userService) UpdateUser(ctx context.Context, tx sql.Queries, user *domain.DetailedUser, cmd *commands.UpdateUserCommand) error {
	links, err := json.Marshal(cmd.SocialLinks)
	if err != nil {
		return utils.NewBadRequestError("failed to marshal links", err)
	}

	suggestionPreferences, err := json.Marshal(cmd.SuggestionPreferences)
	if err != nil {
		return utils.NewBadRequestError("failed to marshal suggestion preferences", err)
	}

	err = tx.UpdateProfileByUserID(ctx, sql.UpdateProfileByUserIDParams{
		UserID:                user.ID,
		UpdatedBy:             user.ID,
		DisplayName:           cmd.DisplayName,
		Username:              strings.ToLower(cmd.Username),
		Description:           cmd.Description,
		Links:                 links,
		SuggestionPreferences: suggestionPreferences,
	})
	if err == pgx.ErrNoRows {
		return utils.NewNotFoundError("profile not found", err)
	} else if err != nil {
		return utils.NewInternalServerError("failed to update profile", err)
	}

	return nil
}

func (s *userService) UpdateSuggestionPreferences(ctx context.Context, user *domain.DetailedUser, req *req.UserSuggestionPreferences) error {
	jsonb, err := json.Marshal(req)
	if err != nil {
		return utils.NewBadRequestError("failed to marshal suggestion preferences", err)
	}

	err = s.sqlDb.Queries().UpdateProfileSuggestionPreferences(ctx, sql.UpdateProfileSuggestionPreferencesParams{
		UserID:                user.ID,
		UpdatedBy:             user.ID,
		SuggestionPreferences: jsonb,
	})
	if err != nil {
		return utils.NewInternalServerError("failed to update suggestion preferences", err)
	}
	return nil
}

func (s *userService) CreateUser(ctx context.Context, cmd *commands.CreateUserCommand) (*domain.DetailedUser, error) {
	userID, err := uuid.Parse(cmd.IdentityID)
	if err != nil {
		return nil, utils.NewBadRequestError("Invalid user ID", err)
	}

	var (
		avatarUrl *string
	)

	if cmd.AvatarURL != "" {
		avatarUrl = &cmd.AvatarURL
	}

	username := cmd.Username

	if len(username) < 1 {
		username = strings.Split(cmd.Email, "@")[0] // TODO: use email as username
		if len(username) < 1 {
			return nil, utils.NewBadRequestError("Invalid email format", nil)
		}
	}

	const maxAttempts = 10
	attempts := 0

	for {
		err := s.ValidateUsername(ctx, username)
		if err == nil {
			break
		}
		if attempts >= maxAttempts {
			username = uuid.New().String()
			break
		}
		username = strings.ToLower(petname.Generate(2, "-"))
		attempts++
	}

	suggestionPreferences := &domain.SuggestionPreferences{
		Enabled:            false,
		AllowedFree:        true,
		AllowedAnonymously: true,
		Categories: []domain.ContentCategory{
			domain.ContentCategoryGames,
			domain.ContentCategoryMovies,
			domain.ContentCategoryAnime,
			domain.ContentCategoryVideos,
			domain.ContentCategorySeries,
		},
	}

	jsonb, err := json.Marshal(suggestionPreferences)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to marshal suggestion preferences", err)
	}

	links, err := json.Marshal([]domain.ProfileLink{})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to marshal links", err)
	}

	createdUser, err := s.sqlDb.Queries().InsertProfile(ctx, sql.InsertProfileParams{
		UserID:                userID,
		DisplayName:           username,
		Description:           "",
		Username:              username,
		SuggestionPreferences: jsonb,
		Links:                 links,
	})
	if err != nil {
		return nil, utils.NewInternalServerError("failed to create a profile", err)
	}

	_, err = s.avatarService.CreateAvatarForUser(ctx, userID, nil, avatarUrl)
	if err != nil {
		return nil, err
	}

	return createdUser, nil

}
