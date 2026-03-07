package sql

import (
	"context"

	"github.com/google/uuid"
)

const countFollowers = `
SELECT COUNT(*)
FROM followers
WHERE user_id = $1::uuid
`

func (q *queries) CountFollowers(ctx context.Context, userID uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, countFollowers, userID)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const deleteFollower = `
DELETE FROM followers
WHERE user_id = $1::uuid
	AND follower_id = $2::uuid
`

func (q *queries) DeleteFollower(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error {
	_, err := q.tx.Exec(ctx, deleteFollower, userID, followerID)
	return err
}

const insertFollower = `
INSERT INTO followers (user_id, follower_id)
VALUES (
	$1::uuid,
	$2::uuid
)
`

func (q *queries) InsertFollower(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error {
	_, err := q.tx.Exec(ctx, insertFollower, userID, followerID)
	return err
}

const isFollowing = `
SELECT COUNT(*)
FROM followers
WHERE user_id = $1::uuid
	AND follower_id = $2::uuid
`

func (q *queries) IsFollowing(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, isFollowing, userID, followerID)
	var count int64
	err := row.Scan(&count)
	return count, err
}
