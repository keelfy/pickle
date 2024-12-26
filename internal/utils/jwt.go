package utils

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/middleware"
)

func UserIdFromContext(ctx context.Context) uuid.UUID {
	return ctx.Value(middleware.UserIDKey).(uuid.UUID)
}
