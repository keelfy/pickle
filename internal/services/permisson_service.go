package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/types"
)

type PermissionService interface {
	HasPermission(ctx context.Context, ownerID, userID uuid.UUID, permission types.Permission) (bool, error)
}

type permissionService struct {
	moderatorService ModeratorService
}

func NewPermissionService(moderatorService ModeratorService) PermissionService {
	return &permissionService{moderatorService: moderatorService}
}

func (s *permissionService) HasPermission(ctx context.Context, ownerID, userID uuid.UUID, permission types.Permission) (bool, error) {
	switch permission {
	case types.ModeratorPermission:
		if ownerID == userID {
			return true, nil
		}
		return s.moderatorService.IsModeratorOf(ctx, ownerID, userID)
	case types.AnyonePermission:
		return true, nil
	default:
		return ownerID == userID, nil
	}
}
