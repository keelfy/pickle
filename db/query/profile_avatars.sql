-- Author: Egor Kuzmin (keelfy)
-- name: InsertProfileAvatar :one
INSERT INTO "profile_avatars" (
        "user_id",
        "created_by",
        "updated_by",
        "avatar_key",
        "avatar_url",
        "avatar_preview_key"
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateProfileAvatarByUserId :one
UPDATE "profile_avatars"
SET "updated_at" = now(),
    "updated_by" = $2,
    "avatar_key" = $3,
    "avatar_url" = $4,
    "avatar_preview_key" = $5
WHERE "user_id" = $1
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileAvatarByUserId :one
SELECT *
FROM "profile_avatars"
WHERE "user_id" = $1;
