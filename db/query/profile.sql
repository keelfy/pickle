-- Author: Egor Kuzmin (keelfy)
-- name: InsertProfile :one
INSERT INTO "profiles" (
    "user_id", 
    "username", 
    "link"
) VALUES (
    $1,
    $2,
    $3
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileById :one
SELECT * FROM "profiles" WHERE "user_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindProfileByLink :one
SELECT * FROM "profiles" WHERE "link" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateProfileByUserId :one
UPDATE "profiles" SET
    "username" = $2,
    "link" = $3
WHERE "user_id" = $1
RETURNING *;
