package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/utils"
)

type PermissionService interface {
	HasPermission(ctx context.Context, ownerID, userID uuid.UUID, permission domain.Permission) (bool, error)
	IsAuthorizedUserHasPermission(ctx context.Context, ownerID uuid.UUID, permission domain.Permission) (bool, error)
}

type permissionService struct {
	moderatorService ModeratorService
}

func NewPermissionService(moderatorService ModeratorService) PermissionService {
	return &permissionService{moderatorService: moderatorService}
}

func (s *permissionService) HasPermission(ctx context.Context, ownerID, userID uuid.UUID, permission domain.Permission) (bool, error) {
	switch permission {
	case domain.ModeratorPermission:
		if ownerID == userID {
			return true, nil
		}
		return s.moderatorService.IsModeratorOf(ctx, ownerID, userID)
	case domain.AnyonePermission:
		return true, nil
	default:
		return ownerID == userID, nil
	}
}

func (s *permissionService) IsAuthorizedUserHasPermission(ctx context.Context, ownerID uuid.UUID, permission domain.Permission) (bool, error) {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return false, utils.NewInternalServerError("failed to get user ID from context", err)
	}

	hasPermission, err := s.HasPermission(ctx, ownerID, authUserID, permission)
	if err != nil {
		return false, err
	}
	return hasPermission, nil
}
