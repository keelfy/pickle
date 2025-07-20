-- name: InsertProfileAvatar :one
INSERT INTO profile_avatars (
        user_id,
        created_by,
        updated_by,
        avatar_key,
        avatar_url,
        avatar_preview_key
    )
VALUES (
        @user_id::uuid,
        sqlc.narg('created_by')::uuid,
        sqlc.narg('updated_by')::uuid,
        sqlc.narg('avatar_key')::text,
        sqlc.narg('avatar_url')::text,
        sqlc.narg('avatar_preview_key')::text
    )
RETURNING *;
-- name: UpdateProfileAvatarByUserId :one
UPDATE profile_avatars
SET updated_at = now(),
    updated_by = sqlc.narg('updated_by')::uuid,
    avatar_key = sqlc.narg('avatar_key')::text,
    avatar_url = sqlc.narg('avatar_url')::text,
    avatar_preview_key = sqlc.narg('avatar_preview_key')::text
WHERE user_id = @user_id::uuid
RETURNING *;
-- name: FindProfileAvatarByUserId :one
SELECT *
FROM profile_avatars
WHERE user_id = @user_id::uuid;