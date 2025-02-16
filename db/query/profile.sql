-- Author: Egor Kuzmin (keelfy)
-- name: InsertProfile :one
INSERT INTO "profiles" (
    "user_id",
    "username",
    "link",
    "description",
    "suggestion_preferences"
) VALUES (
    @user_id::uuid, 
    @username::text, 
    @link::text, 
    @description::text, 
    @suggestion_preferences::jsonb
) RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileById :one
SELECT *
FROM "profiles"
WHERE "user_id" = @user_id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileByLink :one
SELECT *
FROM "profiles"
WHERE "link" = @link::text;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateProfileByUserId :exec
UPDATE "profiles"
SET "updated_at" = now(),
    "updated_by" = @updated_by::uuid,
    "username" = @username::text,
    "link" = @link::text,
    "description" = @description::text
WHERE "user_id" = @user_id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateProfileSuggestionPreferences :exec
UPDATE "profiles"
SET "suggestion_preferences" = @suggestion_preferences::jsonb,
    "updated_at" = now(),
    "updated_by" = @updated_by::uuid
WHERE "user_id" = @user_id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: GetUserFollows :many
SELECT p.* 
FROM "profiles" p
JOIN "followers" f ON p."user_id" = f."user_id"
WHERE f."follower_id" = @follower_id::uuid
ORDER BY f."created_at" DESC;
