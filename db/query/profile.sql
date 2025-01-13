-- Author: Egor Kuzmin (keelfy)
-- name: InsertProfile :one
INSERT INTO "profiles" (
        "user_id",
        "username",
        "link",
        "description",
        "avatar_url",
        "avatar_preview_key"
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileById :one
SELECT *
FROM "profiles"
WHERE "user_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileByLink :one
SELECT *
FROM "profiles"
WHERE "link" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateProfileByUserId :one
UPDATE "profiles"
SET "updated_at" = now(),
    "updated_by" = $2,
    "username" = $3,
    "link" = $4,
    "description" = $5,
    "avatar_url" = $6,
    "avatar_preview_key" = $7
WHERE "user_id" = $1
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateProfilePreviewAvatarByUserId :exec
UPDATE "profiles"
SET "updated_at" = now(),
    "updated_by" = $2,
    "avatar_preview_key" = $3
WHERE "user_id" = $1;
