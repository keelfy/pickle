package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"
)

type ModeratorService interface {
	GetModeratorByUserIDAndModeratorID(ctx context.Context, userID, moderatorID uuid.UUID) (*domain.Moderator, error)
	AddModeratorByUsername(ctx context.Context, user domain.IUser, cmd *commands.AddModeratorCommand) (*domain.ModeratorUser, error)
	DeleteModerator(ctx context.Context, cmd *commands.DeleteModeratorCommand) error
	GetModeratorsByUserID(ctx context.Context, userId uuid.UUID) ([]*domain.ModeratorUser, error)
	IsModeratorOf(ctx context.Context, userID, moderatorID uuid.UUID) (bool, error)

	ClearModeratorsCache(ctx context.Context, userID uuid.UUID)
	GetModeratorsFromCache(ctx context.Context, userID uuid.UUID) (uuid.UUIDs, error)
	SetModeratorsToCache(ctx context.Context, userID uuid.UUID, moderators []*domain.Moderator) error
}

type moderatorService struct {
	sqlDb         storage.RelationalStorage
	cache         storage.CacheStorage
	sfGroup       singleflight.Group
	avatarService AvatarService
	userService   UserService
	logger        *zap.SugaredLogger
}

func NewModeratorService(sqlDb storage.RelationalStorage, cache storage.CacheStorage,
	avatarService AvatarService, userService UserService, zapLogger *zap.SugaredLogger,
) ModeratorService {
	return &moderatorService{
		sqlDb:         sqlDb,
		cache:         cache,
		sfGroup:       singleflight.Group{},
		avatarService: avatarService,
		userService:   userService, logger: zapLogger,
	}
}

func (s *moderatorService) getModeratorsKey(userID uuid.UUID) string {
	return fmt.Sprintf("moderators:%s", userID)
}

func (s *moderatorService) ClearModeratorsCache(ctx context.Context, userID uuid.UUID) {
	_ = s.cache.DeleteKey(ctx, s.getModeratorsKey(userID))
	s.sfGroup.Forget(s.getModeratorsKey(userID))
}

func (s *moderatorService) GetModeratorsFromCache(ctx context.Context, userID uuid.UUID) (uuid.UUIDs, error) {
	cacheKey := s.getModeratorsKey(userID)
	moderators, err := s.cache.GetKey(ctx, cacheKey)
	if err != nil {
		return nil, err
	}

	userIds := strings.Split(moderators, ",")
	uuids := make(uuid.UUIDs, len(userIds))
	for i, id := range userIds {
		uuids[i], err = uuid.Parse(id)
		if err != nil {
			s.ClearModeratorsCache(ctx, userID)
			return nil, fmt.Errorf("error parsing moderator id: %w", err)
		}
	}
	return uuids, nil
}

func (s *moderatorService) SetModeratorsToCache(ctx context.Context, userID uuid.UUID, moderators []*domain.Moderator) error {
	cacheKey := s.getModeratorsKey(userID)
	userIds := make([]string, len(moderators))
	for i, moderator := range moderators {
		userIds[i] = moderator.ModeratorID.String()
	}
	moderatorsStr := strings.Join(userIds, ",")
	return s.cache.SetKey(ctx, cacheKey, moderatorsStr, 24*time.Hour)
}

func (s *moderatorService) GetModeratorByUserIDAndModeratorID(ctx context.Context, userID, moderatorID uuid.UUID) (*domain.Moderator, error) {
	moderator, err := s.sqlDb.Queries().FindModeratorByUserIDAndModeratorIDAndNotDeleted(ctx, userID, moderatorID)
	if err == pgx.ErrNoRows {
		return nil, utils.NewNotFoundError("Moderator not found", err)
	} else if err != nil {
		return nil, utils.NewInternalServerError("Error getting moderator by id", err)
	}
	return moderator, nil
}

func (s *moderatorService) AddModeratorByUsername(ctx context.Context, user domain.IUser, cmd *commands.AddModeratorCommand) (*domain.ModeratorUser, error) {
	moderatorUser, err := s.userService.GetDetailedUserByUsername(ctx, cmd.Username)
	if err != nil {
		return nil, err
	}

	if user.GetID() == moderatorUser.ID {
		return nil, utils.NewBadRequestError("You cannot add yourself as a moderator", nil)
	}

	existingModRelation, err := s.sqlDb.Queries().FindModeratorByUserIDAndModeratorID(ctx, user.GetID(), moderatorUser.ID)
	if err == pgx.ErrNoRows {
		existingModRelation = nil
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to get moderator relation", err)
	}

	modRelation := existingModRelation

	if existingModRelation != nil {
		if existingModRelation.DeletedAt == nil {
			return nil, utils.NewBadRequestError("user is already a moderator", nil)
		}

		err = s.sqlDb.Queries().RevertModeratorByUserIDAndModeratorID(ctx, user.GetID(), moderatorUser.ID)
		if err != nil {
			return nil, utils.NewInternalServerError("failed to revert moderator", err)
		}
	} else {
		modRelation, err = s.sqlDb.Queries().InsertModerator(ctx, sql.InsertModeratorParams{
			UserID:          user.GetID(),
			ModeratorUserID: moderatorUser.ID,
			CreatedBy:       user.GetID(),
		})
		if err != nil {
			return nil, utils.NewInternalServerError("failed to create moderator", err)
		}
	}

	return &domain.ModeratorUser{
		Moderator: modRelation,
		User:      moderatorUser.User,
	}, nil
}

func (s *moderatorService) DeleteModerator(ctx context.Context, cmd *commands.DeleteModeratorCommand) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return err
	}

	err = s.sqlDb.Queries().DeleteModeratorByUserIDAndModeratorID(ctx, authUserID, cmd.UserID, cmd.ModeratorUserID)
	if err == pgx.ErrNoRows {
		return utils.NewNotFoundError("moderator not found", err)
	} else if err != nil {
		return utils.NewInternalServerError("failed to delete moderator", err)
	}
	return nil
}

func (s *moderatorService) IsModeratorOf(ctx context.Context, userID, moderatorID uuid.UUID) (bool, error) {
	cachedMods, err := s.GetModeratorsFromCache(ctx, userID)
	if err == nil {
		for _, moderator := range cachedMods {
			if moderator == moderatorID {
				return true, nil
			}
		}
		return false, nil
	}

	cacheKey := s.getModeratorsKey(userID)
	value, err, _ := s.sfGroup.Do(cacheKey, func() (interface{}, error) {
		moderators, err := s.sqlDb.Queries().FindModeratorsByUserID(ctx, userID)
		if err != nil {
			return false, utils.NewInternalServerError("Error occurred during getting moderators by user id", err)
		}

		s.SetModeratorsToCache(ctx, userID, moderators)

		for _, moderator := range moderators {
			if moderator.ModeratorID == moderatorID {
				return true, nil
			}
		}
		return false, nil
	})
	if err != nil {
		return false, err
	}

	isModerator := value.(bool)
	return isModerator, nil
}

func (s *moderatorService) GetModeratorsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.ModeratorUser, error) {
	moderators, err := s.sqlDb.Queries().FindModeratorUsersByUserID(ctx, userID)
	if err != nil {
		return nil, utils.NewInternalServerError("Error occurred during getting moderators by user id", err)
	}
	return moderators, nil
}
