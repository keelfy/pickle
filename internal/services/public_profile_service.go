package services

import (
	"context"
	"sync"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/utils"
)

type PublicProfileService interface {
	GetPublicProfileByLink(ctx context.Context, userLink, avatarSize string) (*models.PublicProfile, error)
	GetPublicProfileByID(ctx context.Context, userID uuid.UUID, avatarSize string) (*models.PublicProfile, error)
	GetPublicProfile(ctx context.Context, profile *db.Profile, avatarSize string) (*models.PublicProfile, error)
}

type publicProfileService struct {
	avatarService      AvatarService
	followerService    FollowerService
	moderatorService   ModeratorService
	orderService       OrderService
	profileService     ProfileService
	contentNoteService ContentNoteService
	connectionService  ConnectionService
}

func NewPublicProfileService(
	avatarService AvatarService, followerService FollowerService,
	moderatorService ModeratorService, orderService OrderService,
	profileService ProfileService, contentNoteService ContentNoteService,
	connectionService ConnectionService,
) PublicProfileService {
	return &publicProfileService{
		avatarService:      avatarService,
		followerService:    followerService,
		moderatorService:   moderatorService,
		orderService:       orderService,
		profileService:     profileService,
		contentNoteService: contentNoteService,
		connectionService:  connectionService,
	}
}

func (s *publicProfileService) GetPublicProfileByID(ctx context.Context, userID uuid.UUID, avatarSize string) (*models.PublicProfile, error) {
	profile, err := s.profileService.GetProfileById(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.GetPublicProfile(ctx, profile, avatarSize)
}

func (s *publicProfileService) GetPublicProfileByLink(ctx context.Context, userLink, avatarSize string) (*models.PublicProfile, error) {
	profile, err := s.profileService.GetProfileByLink(ctx, userLink)
	if err != nil {
		return nil, err
	}
	return s.GetPublicProfile(ctx, profile, avatarSize)
}

func (s *publicProfileService) GetPublicProfile(ctx context.Context, profile *db.Profile, avatarSize string) (*models.PublicProfile, error) {
	authUserId := utils.UserIdFromContextOrNil(ctx)

	var wg sync.WaitGroup

	counts := &models.PublicProfileCounts{}
	publicProfile := &models.PublicProfile{
		ID:           profile.UserID,
		Username:     profile.Username,
		Link:         profile.Link,
		Description:  profile.Description,
		IsFollowing:  authUserId == profile.UserID,
		IsAuthorized: authUserId == profile.UserID,
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		suggestionPreferences, err := s.profileService.ParseSuggestionPreferences(ctx, profile)
		if err != nil {
			logger.Errorf(ctx, "Error occurred during parsing suggestion preferences: %v", err)
		}
		publicProfile.SuggestionPreferences = suggestionPreferences
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		playedCount, playedErr := s.contentNoteService.CountPlayedContentByUserID(ctx, profile.UserID)
		if playedErr != nil {
			logger.Errorf(ctx, "Error occurred during played count: %v", playedErr)
			return
		}
		counts.Played = playedCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		watchedCount, watchedErr := s.contentNoteService.CountWatchedContentByUserID(ctx, profile.UserID)
		if watchedErr != nil {
			logger.Errorf(ctx, "Error occurred during watched count: %v", watchedErr)
			return
		}
		counts.Watched = watchedCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		orderedCount, orderedErr := s.orderService.CountOrdersByReceiverId(ctx, profile.UserID)
		if orderedErr != nil {
			logger.Errorf(ctx, "Error occurred during ordered count: %v", orderedErr)
			return
		}
		counts.Ordered = orderedCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		followerCount, followerErr := s.followerService.CountFollowers(ctx, profile.UserID)
		if followerErr != nil {
			logger.Errorf(ctx, "Error occurred during followers count: %v", followerErr)
			return
		}
		counts.Followers = followerCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		avatarUrl, avatarErr := s.avatarService.GetAvatarUrlById(ctx, profile.UserID, avatarSize)
		if avatarErr != nil {
			logger.Errorf(ctx, "Error occurred during avatar url: %v", avatarErr)
			return
		}
		publicProfile.AvatarURL = avatarUrl
	}()

	if authUserId != uuid.Nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			isFollowing, isFollowingErr := s.followerService.IsFollowing(ctx, profile.UserID, authUserId)
			if isFollowingErr != nil {
				logger.Errorf(ctx, "Error occurred during following status check: %v", isFollowingErr)
				return
			}
			publicProfile.IsFollowing = isFollowing
		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			isModerator, isModeratorErr := s.moderatorService.IsModeratorOf(ctx, profile.UserID, authUserId)
			if isModeratorErr != nil {
				logger.Errorf(ctx, "Error occurred during authorization check: %v", isModeratorErr)
			}
			publicProfile.IsAuthorized = isModerator || authUserId == profile.UserID
		}()
	}

	wg.Wait()

	publicProfile.Counts = *counts

	return publicProfile, nil
}
