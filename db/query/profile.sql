-- name: InsertProfile :one
INSERT INTO profiles (
        user_id,
        display_name,
        username,
        description,
        suggestion_preferences
    )
VALUES (
        @user_id::uuid,
        @display_name::text,
        @username::text,
        @description::text,
        @suggestion_preferences::jsonb
    )
RETURNING *;
-- name: FindProfileByID :one
SELECT *
FROM profiles
WHERE user_id = @user_id::uuid;
-- name: FindProfileByUsername :one
SELECT *
FROM profiles
WHERE username = @username::text;
-- name: UpdateProfileByUserID :exec
UPDATE profiles
SET updated_at = now(),
    updated_by = @updated_by::uuid,
    display_name = @display_name::text,
    username = @username::text,
    description = @description::text
WHERE user_id = @user_id::uuid;
-- name: UpdateProfileSuggestionPreferences :exec
UPDATE profiles
SET suggestion_preferences = @suggestion_preferences::jsonb,
    updated_at = now(),
    updated_by = @updated_by::uuid
WHERE user_id = @user_id::uuid;
-- name: GetUserFollows :many
SELECT p.*
FROM profiles p
    JOIN followers f ON p.user_id = f.user_id
WHERE f.follower_id = @follower_id::uuid
ORDER BY f.created_at DESC;