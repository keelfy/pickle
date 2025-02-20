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
    @created_by::uuid,
    @created_by::uuid,
    @name::text,
    sqlc.narg('link')::text,
    sqlc.narg('release_date')::timestamptz,
    @game_id::uuid,
    @user_id::uuid,
    sqlc.narg('rate')::smallint,
    sqlc.narg('comment')::text,
    @initial_orderer_id::uuid,
    @status::game_note_status,
    sqlc.narg('last_played_at')::timestamptz,
    sqlc.narg('poster_key')::text
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindGameNoteById :one
SELECT *
FROM "game_notes"
WHERE "id" = @id::uuid;

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
    gn."last_played_at",
    o."username" AS "initial_orderer_username",
    COALESCE(order_counts."count", 0) AS "orderer_count"
FROM "game_notes" gn
    INNER JOIN "orderers" o ON gn."initial_orderer_id" = o."id"
    LEFT JOIN (
        SELECT "game_note_id", COUNT(*) as "count" 
        FROM "game_note_orders" 
        GROUP BY "game_note_id"
    ) order_counts ON gn."id" = order_counts."game_note_id"
WHERE gn."user_id" = @user_id::uuid
    AND gn."updated_at" < @updated_at::timestamptz
ORDER BY gn."updated_at" DESC
LIMIT sqlc.arg('limit')::int;

-- Author: Egor Kuzmin (keelfy)
-- name: CountPlayedGameNotesByUserId :one
SELECT COUNT(*) AS "count"
FROM "game_notes"
WHERE "user_id" = @user_id::uuid
    AND "status" IN ('playing', 'finished', 'dropped', 'paused')
GROUP BY "user_id";

-- Author: Egor Kuzmin (keelfy)
-- name: DeleteGameNoteById :exec
DELETE FROM "game_notes"
WHERE "id" = @id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateGameNoteById :exec
UPDATE "game_notes"
SET "updated_by" = @updated_by::uuid, 
    "updated_at" = now(),
    "name" = @name::text,
    "link" = sqlc.narg('link')::text,
    "release_date" = sqlc.narg('release_date')::timestamptz,
    "rate" = sqlc.narg('rate')::smallint,
    "comment" = sqlc.narg('comment')::text,
    "status" = @status::game_note_status,
    "last_played_at" = sqlc.narg('last_played_at')::timestamptz,
    "poster_key" = sqlc.narg('poster_key')::text
WHERE "id" = @id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateGameNoteName :one
UPDATE "game_notes"
SET "name" = @name::text,
    "updated_by" = @updated_by::uuid,
    "updated_at" = now()
WHERE "id" = @id::uuid
RETURNING *;
