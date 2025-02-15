package services

import (
	"context"
	"errors"

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
		return s.moderatorService.IsModeratorOf(ctx, ownerID, userID)
	case types.OnlyOwnerPermission:
		return ownerID == userID, nil
	case types.AnyonePermission:
		return true, nil
	}

	return false, errors.New("invalid permission")
}
