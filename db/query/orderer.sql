-- Author: Egor Kuzmin (keelfy)
-- name: InsertOrderer :one
INSERT INTO "orderers" (
    "created_by",
    "updated_by",
    "user_id",
    "username",
    "anonymous"
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindOrdererByID :one
SELECT * FROM "orderers" WHERE "id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindOrdererByUserID :one
SELECT * FROM "orderers" WHERE "user_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateOrdererByUserID :exec
UPDATE "orderers"
SET "updated_at" = now(),
    "updated_by" = $2,
    "username" = $3
WHERE "user_id" = $1;
