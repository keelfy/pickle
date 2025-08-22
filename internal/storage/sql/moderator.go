package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const findModeratorByUserIDAndModeratorID = `
SELECT id, created_at, created_by, deleted_at, deleted_by, user_id, moderator_id
FROM moderators
WHERE user_id = $1::uuid
    AND moderator_id = $2::uuid
`

func (q *queries) FindModeratorByUserIDAndModeratorID(ctx context.Context, userID, modUserID uuid.UUID) (*domain.Moderator, error) {
	row := q.tx.QueryRow(ctx, findModeratorByUserIDAndModeratorID, userID, modUserID)
	var i domain.Moderator
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.DeletedAt,
		&i.DeletedBy,
		&i.UserID,
		&i.ModeratorID,
	)
	return &i, err
}

const findModeratorByUserIDAndModeratorIDAndNotDeleted = `
SELECT 
	id, 
	created_at, 
	created_by, 
	deleted_at, 
	deleted_by, 
	user_id, 
	moderator_id
FROM moderators
WHERE user_id = $1::uuid
    AND moderator_id = $2::uuid
    AND deleted_at IS NULL
`

func (q *queries) FindModeratorByUserIDAndModeratorIDAndNotDeleted(ctx context.Context, userID, modUserID uuid.UUID) (*domain.Moderator, error) {
	row := q.tx.QueryRow(ctx, findModeratorByUserIDAndModeratorIDAndNotDeleted, userID, modUserID)
	var i domain.Moderator
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.DeletedAt,
		&i.DeletedBy,
		&i.UserID,
		&i.ModeratorID,
	)
	return &i, err
}

const findModeratorsByUserID = `
SELECT id, created_at, created_by, deleted_at, deleted_by, user_id, moderator_id
FROM moderators
WHERE user_id = $1::uuid
    AND deleted_at IS NULL
`

func (q *queries) FindModeratorsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Moderator, error) {
	rows, err := q.tx.Query(ctx, findModeratorsByUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.Moderator{}
	for rows.Next() {
		var i domain.Moderator
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.CreatedBy,
			&i.DeletedAt,
			&i.DeletedBy,
			&i.UserID,
			&i.ModeratorID,
		); err != nil {
			return nil, err
		}
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findModeratorUsersByUserID = `
SELECT 
	m.id,
	m.moderator_id,
	m.user_id,
	m.created_at,
	m.created_by,
	m.deleted_at,
	m.deleted_by,
	-- user data
	p.display_name,
	p.username
FROM profiles p
INNER JOIN moderators m ON p.user_id = m.moderator_id AND m.deleted_at IS NULL
WHERE m.user_id = $1::uuid
ORDER BY m.created_at DESC
`

func (q *queries) FindModeratorUsersByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.ModeratorUser, error) {
	rows, err := q.tx.Query(ctx, findModeratorUsersByUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.ModeratorUser{}
	for rows.Next() {
		var i domain.ModeratorUser
		if err := rows.Scan(
			&i.Moderator.ID,
			&i.Moderator.ModeratorID,
			&i.Moderator.UserID,
			&i.Moderator.CreatedAt,
			&i.Moderator.CreatedBy,
			&i.Moderator.DeletedAt,
			&i.Moderator.DeletedBy,
			&i.User.DisplayName,
			&i.User.Username,
		); err != nil {
			return nil, err
		}
		i.User.ID = i.Moderator.UserID
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const deleteModeratorByUserIDAndModeratorID = `
UPDATE moderators
SET deleted_at = now(),
    deleted_by = $1::uuid
WHERE user_id = $2::uuid
    AND moderator_id = $3::uuid
    AND deleted_at IS NULL
`

func (q *queries) DeleteModeratorByUserIDAndModeratorID(ctx context.Context, deletedBy, userID, modUserID uuid.UUID) error {
	_, err := q.tx.Exec(ctx, deleteModeratorByUserIDAndModeratorID, deletedBy, userID, modUserID)
	return err
}

const insertModerator = `
INSERT INTO moderators (user_id, moderator_id, created_by)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::uuid
)
RETURNING id, created_at, created_by, deleted_at, deleted_by, user_id, moderator_id
`

type InsertModeratorParams struct {
	UserID          uuid.UUID
	ModeratorUserID uuid.UUID
	CreatedBy       uuid.UUID
}

func (q *queries) InsertModerator(ctx context.Context, arg InsertModeratorParams) (*domain.Moderator, error) {
	row := q.tx.QueryRow(ctx, insertModerator, arg.UserID, arg.ModeratorUserID, arg.CreatedBy)
	var i domain.Moderator
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.DeletedAt,
		&i.DeletedBy,
		&i.UserID,
		&i.ModeratorID,
	)
	return &i, err
}

const revertModeratorByUserIDAndModeratorID = `
UPDATE moderators
SET deleted_at = NULL,
    deleted_by = NULL
WHERE user_id = $1::uuid
    AND moderator_id = $2::uuid
`

func (q *queries) RevertModeratorByUserIDAndModeratorID(ctx context.Context, userID, modUserID uuid.UUID) error {
	_, err := q.tx.Exec(ctx, revertModeratorByUserIDAndModeratorID, userID, modUserID)
	return err
}
