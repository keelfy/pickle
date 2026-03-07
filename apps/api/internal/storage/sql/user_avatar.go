package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const findUserAvatarByUserID = `
SELECT 
	user_id, 
	created_at, 
	created_by, 
	updated_at, 
	updated_by, 
	avatar_key, 
	avatar_url, 
	avatar_preview_key
FROM profile_avatars
WHERE user_id = $1::uuid
`

func (q *queries) FindUserAvatarByUserID(ctx context.Context, userID uuid.UUID) (*domain.UserAvatar, error) {
	row := q.tx.QueryRow(ctx, findUserAvatarByUserID, userID)
	var i domain.UserAvatar
	err := row.Scan(
		&i.UserID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.AvatarKey,
		&i.AvatarUrl,
		&i.AvatarPreviewKey,
	)
	return &i, err
}

const insertUserAvatar = `
INSERT INTO profile_avatars (
	user_id,
	created_by,
	updated_by,
	avatar_key,
	avatar_url,
	avatar_preview_key
)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::uuid,
	$4::text,
	$5::text,
	$6::text
)
RETURNING user_id, created_at, created_by, updated_at, updated_by, avatar_key, avatar_url, avatar_preview_key
`

type InsertUserAvatarParams struct {
	UserID           uuid.UUID  `json:"user_id"`
	CreatedBy        *uuid.UUID `json:"created_by"`
	UpdatedBy        *uuid.UUID `json:"updated_by"`
	AvatarKey        *string    `json:"avatar_key"`
	AvatarUrl        *string    `json:"avatar_url"`
	AvatarPreviewKey *string    `json:"avatar_preview_key"`
}

func (q *queries) InsertUserAvatar(ctx context.Context, arg InsertUserAvatarParams) (*domain.UserAvatar, error) {
	row := q.tx.QueryRow(ctx, insertUserAvatar,
		arg.UserID,
		arg.CreatedBy,
		arg.UpdatedBy,
		arg.AvatarKey,
		arg.AvatarUrl,
		arg.AvatarPreviewKey,
	)
	var i domain.UserAvatar
	err := row.Scan(
		&i.UserID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.AvatarKey,
		&i.AvatarUrl,
		&i.AvatarPreviewKey,
	)
	return &i, err
}

const updateUserAvatarByUserID = `
UPDATE profile_avatars
SET updated_at = now(),
    updated_by = $1::uuid,
    avatar_key = $2::text,
    avatar_url = $3::text,
    avatar_preview_key = $4::text
WHERE user_id = $5::uuid
RETURNING user_id, created_at, created_by, updated_at, updated_by, avatar_key, avatar_url, avatar_preview_key
`

type UpdateUserAvatarByUserIDParams struct {
	UpdatedBy        *uuid.UUID `json:"updated_by"`
	AvatarKey        *string    `json:"avatar_key"`
	AvatarUrl        *string    `json:"avatar_url"`
	AvatarPreviewKey *string    `json:"avatar_preview_key"`
	UserID           uuid.UUID  `json:"user_id"`
}

func (q *queries) UpdateUserAvatarByUserID(ctx context.Context, arg UpdateUserAvatarByUserIDParams) (*domain.UserAvatar, error) {
	row := q.tx.QueryRow(ctx, updateUserAvatarByUserID,
		arg.UpdatedBy,
		arg.AvatarKey,
		arg.AvatarUrl,
		arg.AvatarPreviewKey,
		arg.UserID,
	)
	var i domain.UserAvatar
	err := row.Scan(
		&i.UserID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.AvatarKey,
		&i.AvatarUrl,
		&i.AvatarPreviewKey,
	)
	return &i, err
}
