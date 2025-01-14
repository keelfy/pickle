-- Author: Egor Kuzmin (keelfy)
-- name: InsertGameNote :one
INSERT INTO "game_notes" (
    "created_by",
    "updated_by",
    "name",
    "link",
    "release_date",
    "game_id",
    "user_id",
    "rate",
    "comment",
    "ordered",
    "status",
    "last_played_at"
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindGameNoteById :one
SELECT *
FROM "game_notes"
WHERE "id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindPaginatedGameNotesByUserId :many
SELECT * 
FROM "game_notes" 
WHERE "user_id" = $1
    AND "updated_at" < $2
ORDER BY "updated_at" DESC
LIMIT $3;

-- Author: Egor Kuzmin (keelfy)
-- name: CountGameNotesByUserId :one
SELECT COUNT(*) AS "total"
FROM "game_notes"
WHERE "user_id" = $1;
