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
    "initial_orderer_id",
    "status",
    "last_played_at",
    "poster_key"
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
    $12,
    $13
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindGameNoteById :one
SELECT *
FROM "game_notes"
WHERE "id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindPaginatedGameNotesByUserId :many
SELECT 
    gn."id",
    gn."created_at",
    gn."name",
    gn."status",
    gn."rate",
    gn."comment",
    gn."release_date",
    o."username" AS "initial_orderer_username"
FROM "game_notes" gn
    JOIN "orderers" o ON gn."initial_orderer_id" = o."id"
WHERE gn."user_id" = $1
    AND gn."updated_at" < $2
ORDER BY gn."updated_at" DESC
LIMIT $3;

-- Author: Egor Kuzmin (keelfy)
-- name: CountPlayedGameNotesByUserId :one
SELECT COUNT(*) AS "count"
FROM "game_notes"
WHERE "user_id" = $1
    AND "status" IN ('playing', 'finished', 'dropped')
GROUP BY "user_id";
