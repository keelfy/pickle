package utils

import (
	"context"

	"github.com/google/uuid"
	ory "github.com/ory/client-go"
	"github.com/pickle.pw/monolith/internal/errors"
)

func GetUserIDFromCtx(ctx context.Context) (uuid.UUID, error) {
	session, ok := ctx.Value("req.session").(*ory.Session)
	if !ok || session == nil {
		return uuid.Nil, errors.NewForbiddenError("Authorization header is missing", nil)
	}
	userID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return uuid.Nil, errors.NewForbiddenError("Authorization header is missing", nil)
	}
	return userID, nil
}

func GetUserIDFromContextOrNil(ctx context.Context) *uuid.UUID {
	session, ok := ctx.Value("req.session").(*ory.Session)
	if !ok || session == nil {
		return nil
	}
	userID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		return nil
	}
	return &userID
}
