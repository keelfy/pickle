package domain

import (
	"time"

	"github.com/google/uuid"
)

type AvatarSize string

const (
	AvatarSizeSmall  AvatarSize = "sm"
	AvatarSizeMedium AvatarSize = "md"
	AvatarSizeLarge  AvatarSize = "lg"
)

var AvatarSizes = map[AvatarSize]int{AvatarSizeSmall: 32, AvatarSizeMedium: 64, AvatarSizeLarge: 128}

type UserAvatar struct {
	UserID           uuid.UUID
	CreatedAt        time.Time
	CreatedBy        *uuid.UUID
	UpdatedAt        time.Time
	UpdatedBy        *uuid.UUID
	AvatarKey        *string
	AvatarUrl        *string
	AvatarPreviewKey *string
}
