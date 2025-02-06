-- Author: Egor Kuzmin (keelfy)
-- name: InsertProfile :one
INSERT INTO "profiles" (
        "user_id",
        "username",
        "link",
        "description"
    )
VALUES ($1, $2, $3, $4)
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
    "description" = $5
WHERE "user_id" = $1
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: GetUserFollows :many
SELECT p.* 
FROM "profiles" p
JOIN "followers" f ON p."user_id" = f."user_id"
WHERE f."follower_id" = $1
ORDER BY f."created_at" DESC;
