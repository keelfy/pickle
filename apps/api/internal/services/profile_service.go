package services

import (
	"context"
	"sync"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type ProfileService interface {
	GetProfileCounts(ctx context.Context, userID uuid.UUID) (*domain.ProfileCounts, error)
	GetProfileContext(ctx context.Context, userID uuid.UUID) (*domain.UserContext, error)
}

type profileService struct {
	avatarService      AvatarService
	followerService    FollowerService
	moderatorService   ModeratorService
	orderService       OrderService
	userService        UserService
	contentNoteService ContentNoteService
	logger             *zap.SugaredLogger
}

func NewProfileService(
	avatarService AvatarService, followerService FollowerService,
	moderatorService ModeratorService, orderService OrderService,
	userService UserService, contentNoteService ContentNoteService, zapLogger *zap.SugaredLogger,
) ProfileService {
	return &profileService{
		avatarService:      avatarService,
		followerService:    followerService,
		moderatorService:   moderatorService,
		orderService:       orderService,
		userService:        userService,
		contentNoteService: contentNoteService, logger: zapLogger,
	}
}

func (s *profileService) GetProfileCounts(ctx context.Context, userID uuid.UUID) (*domain.ProfileCounts, error) {
	counts := &domain.ProfileCounts{}

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		playedCount, playedErr := s.contentNoteService.CountPlayedContentByUserID(ctx, userID)
		if playedErr != nil {
			s.logger.Errorf("Error occurred during played count: %v", playedErr)
			return
		}
		counts.Played = playedCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		watchedCount, watchedErr := s.contentNoteService.CountWatchedContentByUserID(ctx, userID)
		if watchedErr != nil {
			s.logger.Errorf("Error occurred during watched count: %v", watchedErr)
			return
		}
		counts.Watched = watchedCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		orderedCount, orderedErr := s.orderService.CountOrdersByReceiverID(ctx, userID)
		if orderedErr != nil {
			s.logger.Errorf("Error occurred during ordered count: %v", orderedErr)
			return
		}
		counts.Ordered = orderedCount
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		followerCount, followerErr := s.followerService.CountFollowers(ctx, userID)
		if followerErr != nil {
			s.logger.Errorf("Error occurred during followers count: %v", followerErr)
			return
		}
		counts.Followers = followerCount
	}()

	wg.Wait()

	return counts, nil
}

func (s *profileService) GetProfileContext(ctx context.Context, userID uuid.UUID) (*domain.UserContext, error) {
	authUserID := utils.GetUserIDFromContextOrNil(ctx)

	isAuthorized := authUserID != nil && *authUserID == userID
	profileCtx := &domain.UserContext{
		IsFollowing:  false,
		IsAuthorized: isAuthorized,
		IsModerator:  isAuthorized,
	}

	if authUserID == nil {
		return profileCtx, nil
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		isFollowing, isFollowingErr := s.followerService.IsFollowing(ctx, userID, *authUserID)
		if isFollowingErr != nil {
			s.logger.Errorf("Error occurred during following status check: %v", isFollowingErr)
			return
		}
		profileCtx.IsFollowing = isFollowing
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		isModerator, isModeratorErr := s.moderatorService.IsModeratorOf(ctx, userID, *authUserID)
		if isModeratorErr != nil {
			s.logger.Errorf("Error occurred during authorization check: %v", isModeratorErr)
		}
		profileCtx.IsAuthorized = isModerator || *authUserID == userID
		profileCtx.IsModerator = isModerator
	}()

	wg.Wait()

	return profileCtx, nil
}
