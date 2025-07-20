-- name: InsertModerator :one
INSERT INTO moderators (user_id, moderator_id, created_by)
VALUES (
        @user_id::uuid,
        @moderator_id::uuid,
        @created_by::uuid
    )
RETURNING *;
-- name: FindModeratorByUserIDAndModeratorIDAndNotDeleted :one
SELECT *
FROM moderators
WHERE user_id = @user_id::uuid
    AND moderator_id = @moderator_id::uuid
    AND deleted_at IS NULL;
-- name: FindModeratorByUserIDAndModeratorID :one
SELECT *
FROM moderators
WHERE user_id = @user_id::uuid
    AND moderator_id = @moderator_id::uuid;
-- name: DeleteModeratorByUserIDAndModeratorID :exec
UPDATE moderators
SET deleted_at = now(),
    deleted_by = @deleted_by::uuid
WHERE user_id = @user_id::uuid
    AND moderator_id = @moderator_id::uuid
    AND deleted_at IS NULL;
-- name: RevertModeratorByUserIDAndModeratorID :exec
UPDATE moderators
SET deleted_at = NULL,
    deleted_by = NULL
WHERE user_id = @user_id::uuid
    AND moderator_id = @moderator_id::uuid;
-- name: FindModeratorsByUserID :many
SELECT *
FROM moderators
WHERE user_id = @user_id::uuid
    AND deleted_at IS NULL;
-- name: FindProfilesByModeratorID :many
SELECT p.user_id,
    p.display_name,
    p.username,
    m.created_at
FROM profiles p
    INNER JOIN moderators m ON p.user_id = m.user_id
    AND m.deleted_at IS NULL
WHERE m.moderator_id = @moderator_id::uuid
ORDER BY m.created_at DESC;
-- name: FindModeratorProfilesByUserID :many
SELECT p.user_id,
    p.display_name,
    p.username,
    m.created_at AS added_at,
    pa.avatar_url
FROM profiles p
    INNER JOIN moderators m ON p.user_id = m.moderator_id
    AND m.deleted_at IS NULL
    INNER JOIN profile_avatars pa ON p.user_id = pa.user_id
WHERE m.user_id = @user_id::uuid
ORDER BY m.created_at DESC;
-- name: FindModeratorProfileByUserIDAndModeratorID :one
SELECT p.user_id,
    p.display_name,
    p.username,
    m.created_at AS added_at,
    pa.avatar_url
FROM profiles p
    INNER JOIN moderators m ON p.user_id = m.moderator_id
    AND m.deleted_at IS NULL
    INNER JOIN profile_avatars pa ON p.user_id = pa.user_id
WHERE m.user_id = @user_id::uuid
    AND m.moderator_id = @moderator_id::uuid;