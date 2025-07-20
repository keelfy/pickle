package services

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"
)

type ModeratorService interface {
	GetModeratorByUserIDAndModeratorID(ctx context.Context, userID, moderatorID uuid.UUID) (*db.Moderator, error)
	AddModeratorByUserLink(ctx context.Context, userId uuid.UUID, userLink, avatarSize string) (*models.ModeratorProfile, error)
	DeleteModerator(ctx context.Context, userID, moderatorID uuid.UUID) error
	GetModeratorsByUserID(ctx context.Context, userId uuid.UUID, avatarSize string) ([]*models.ModeratorProfile, error)
	IsModeratorOf(ctx context.Context, userId uuid.UUID, moderatorId uuid.UUID) (bool, error)
}

type moderatorService struct {
	sqlDb          storage.RelationalStorage
	cache          storage.CacheStorage
	sfGroup        singleflight.Group
	avatarService  AvatarService
	profileService ProfileService
}

func NewModeratorService(sqlDb storage.RelationalStorage, cache storage.CacheStorage,
	avatarService AvatarService, profileService ProfileService,
) ModeratorService {
	return &moderatorService{
		sqlDb:          sqlDb,
		cache:          cache,
		sfGroup:        singleflight.Group{},
		avatarService:  avatarService,
		profileService: profileService,
	}
}

func (s *moderatorService) getModeratorsKey(userId uuid.UUID) string {
	return fmt.Sprintf("moderators:%s", userId)
}

func (s *moderatorService) clearModeratorsCache(ctx context.Context, userId uuid.UUID) {
	_ = s.cache.DeleteKey(ctx, s.getModeratorsKey(userId))
	s.sfGroup.Forget(s.getModeratorsKey(userId))
}

func (s *moderatorService) getModeratorsFromCache(ctx context.Context, userId uuid.UUID) (uuid.UUIDs, error) {
	cacheKey := s.getModeratorsKey(userId)
	moderators, err := s.cache.GetKey(ctx, cacheKey)
	if err != nil {
		return nil, err
	}

	userIds := strings.Split(moderators, ",")
	uuids := make(uuid.UUIDs, len(userIds))
	for i, id := range userIds {
		uuids[i], err = uuid.Parse(id)
		if err != nil {
			s.clearModeratorsCache(ctx, userId)
			return nil, fmt.Errorf("error parsing moderator id: %w", err)
		}
	}
	return uuids, nil
}

func (s *moderatorService) setModeratorsToCache(ctx context.Context, userId uuid.UUID, moderators []*db.Moderator) error {
	cacheKey := s.getModeratorsKey(userId)
	userIds := make([]string, len(moderators))
	for i, moderator := range moderators {
		userIds[i] = moderator.ModeratorID.String()
	}
	moderatorsStr := strings.Join(userIds, ",")
	return s.cache.SetKey(ctx, cacheKey, moderatorsStr, 24*time.Hour)
}

func (s *moderatorService) GetModeratorByUserIDAndModeratorID(ctx context.Context, userID, moderatorID uuid.UUID) (*db.Moderator, error) {
	moderator, err := s.sqlDb.Queries().FindModeratorByUserIDAndModeratorIDAndNotDeleted(ctx, db.FindModeratorByUserIDAndModeratorIDAndNotDeletedParams{
		UserID:      userID,
		ModeratorID: moderatorID,
	})
	if err == pgx.ErrNoRows {
		return nil, errors.NewNotFoundError("Moderator not found", err)
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error getting moderator by id", err)
	}
	return moderator, nil
}

func (s *moderatorService) AddModeratorByUserLink(ctx context.Context, userId uuid.UUID, userLink, avatarSize string) (*models.ModeratorProfile, error) {
	authUserId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	if userId != authUserId {
		return nil, errors.NewBadRequestError("Only the profile owner can add a moderator", nil)
	}

	linkParts := strings.Split(userLink, "/")
	link := linkParts[len(linkParts)-1]

	moderator, err := s.profileService.GetProfileByUsername(ctx, link)
	if err != nil {
		return nil, err
	}

	if userId == moderator.UserID {
		return nil, errors.NewBadRequestError("You cannot add yourself as a moderator", nil)
	}

	moderatorRelation, err := s.sqlDb.Queries().FindModeratorByUserIDAndModeratorID(ctx, db.FindModeratorByUserIDAndModeratorIDParams{
		UserID:      userId,
		ModeratorID: moderator.UserID,
	})
	if err == pgx.ErrNoRows {
		moderatorRelation = nil
	} else if err != nil {
		return nil, errors.NewInternalServerError("Error getting moderator relation", err)
	}

	if moderatorRelation != nil && moderatorRelation.DeletedAt == nil {
		return nil, errors.NewBadRequestError("User is already a moderator", nil)
	}

	if moderatorRelation != nil && moderatorRelation.DeletedAt != nil {
		err = s.sqlDb.Queries().RevertModeratorByUserIDAndModeratorID(ctx, db.RevertModeratorByUserIDAndModeratorIDParams{
			UserID:      userId,
			ModeratorID: moderator.UserID,
		})
		if err != nil {
			return nil, errors.NewInternalServerError("Error reverting moderator relation", err)
		}
	}

	var (
		group             errgroup.Group
		avatarUrl         string
		insertedModerator *db.Moderator
	)

	group.Go(func() error {
		if moderatorRelation != nil {
			err = s.sqlDb.Queries().RevertModeratorByUserIDAndModeratorID(ctx, db.RevertModeratorByUserIDAndModeratorIDParams{
				UserID:      userId,
				ModeratorID: moderator.UserID,
			})
			if err != nil {
				return errors.NewInternalServerError("Error reverting moderator", err)
			}
			insertedModerator = moderatorRelation
		} else {
			insertedModerator, err = s.sqlDb.Queries().InsertModerator(ctx, db.InsertModeratorParams{
				UserID:      userId,
				ModeratorID: moderator.UserID,
				CreatedBy:   authUserId,
			})
			if err != nil {
				return errors.NewInternalServerError("Error creating moderator", err)
			}
		}
		return nil
	})

	group.Go(func() error {
		avatarUrl, err = s.avatarService.GetAvatarUrlById(ctx, moderator.UserID, avatarSize)
		return err
	})

	err = group.Wait()
	if err != nil {
		return nil, err
	}

	profile := &models.ModeratorProfile{
		ID:          moderator.UserID,
		AddedAt:     insertedModerator.CreatedAt,
		DisplayName: moderator.DisplayName,
		Username:    moderator.Username,
		AvatarURL:   avatarUrl,
	}

	s.clearModeratorsCache(ctx, userId)
	return profile, nil
}

func (s *moderatorService) DeleteModerator(ctx context.Context, userID, moderatorID uuid.UUID) error {
	authUserId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during deleting moderator", err)
	}

	moderator, err := s.GetModeratorByUserIDAndModeratorID(ctx, userID, moderatorID)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during deleting moderator", err)
	}

	if moderator.UserID != authUserId {
		return errors.NewForbiddenError("You are not allowed to delete this moderator", nil)
	}

	err = s.sqlDb.Queries().DeleteModeratorByUserIDAndModeratorID(ctx, db.DeleteModeratorByUserIDAndModeratorIDParams{
		UserID:      userID,
		ModeratorID: moderatorID,
		DeletedBy:   authUserId,
	})
	if err != nil {
		return errors.NewInternalServerError("Error occurred during deleting moderator", err)
	}

	s.clearModeratorsCache(ctx, userID)
	return nil
}

func (s *moderatorService) IsModeratorOf(ctx context.Context, userID, moderatorID uuid.UUID) (bool, error) {
	cachedModeators, err := s.getModeratorsFromCache(ctx, userID)
	if err == nil {
		for _, moderator := range cachedModeators {
			if moderator == moderatorID {
				return true, nil
			}
		}
		return false, nil
	}

	key := s.getModeratorsKey(userID)
	value, err, _ := s.sfGroup.Do(key, func() (interface{}, error) {
		moderators, err := s.sqlDb.Queries().FindModeratorsByUserID(ctx, userID)
		if err != nil {
			return false, errors.NewInternalServerError("Error occurred during getting moderators by user id", err)
		}

		s.setModeratorsToCache(ctx, userID, moderators)

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

func (s *moderatorService) GetModeratorsByUserID(ctx context.Context, userID uuid.UUID, avatarSize string) ([]*models.ModeratorProfile, error) {
	authUserId, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	if authUserId != userID {
		return nil, errors.NewForbiddenError("You are not allowed to get moderators of this profile", nil)
	}

	moderators, err := s.sqlDb.Queries().FindModeratorProfilesByUserID(ctx, userID)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during getting moderators by user id", err)
	}

	var group sync.WaitGroup
	moderatorProfiles := make([]*models.ModeratorProfile, len(moderators))

	group.Add(len(moderators))
	for i, moderator := range moderators {
		go func(i int, moderator *db.FindModeratorProfilesByUserIDRow) {
			defer group.Done()
			avatarUrl, _ := s.avatarService.GetAvatarUrlById(ctx, moderator.UserID, avatarSize)
			moderatorProfiles[i] = &models.ModeratorProfile{
				ID:          moderator.UserID,
				AddedAt:     moderator.AddedAt,
				DisplayName: moderator.DisplayName,
				Username:    moderator.Username,
				AvatarURL:   avatarUrl,
			}
		}(i, moderator)
	}

	group.Wait()

	return moderatorProfiles, nil
}
