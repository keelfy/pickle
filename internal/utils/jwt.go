package utils

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/middleware"
)

func UserIdFromContext(ctx context.Context) (uuid.UUID, error) {
	userId, ok := ctx.Value(middleware.UserIDKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.NewForbiddenError("Authorization header is missing", nil)
	}
	return userId, nil
}
