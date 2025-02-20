-- Author: Egor Kuzmin (keelfy)
-- name: InsertMovieNote :one
INSERT INTO "movie_notes" (
    "user_id",
    "name",
    "release_date",
    "rate",
    "comment",
    "status",
    "initial_orderer_id",
    "watched_at",
    "poster_key",
    "created_by",
    "updated_by"
) VALUES (
    @user_id::uuid,
    @name::text,
    sqlc.narg('release_date')::timestamptz,
    sqlc.narg('rate')::smallint,
    sqlc.narg('comment')::text,
    @status::movie_note_status,
    @initial_orderer_id::uuid,
    sqlc.narg('watched_at')::timestamptz,
    sqlc.narg('poster_key')::text,
    @created_by::uuid,
    @created_by::uuid
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: FindMovieNoteById :one
SELECT *
FROM "movie_notes"
WHERE "id" = @id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: FindPaginatedMovieNotesByUserId :many
SELECT 
    mn."id",
    mn."created_at",
    mn."name",
    mn."status",
    mn."rate",
    mn."comment",
    mn."release_date",
    mn."watched_at",
    o."username" AS "initial_orderer_username",
    COALESCE(order_counts."count", 0) AS "orderer_count"
FROM "movie_notes" mn
LEFT JOIN "orderers" o ON mn."initial_orderer_id" = o."id"
LEFT JOIN (
    SELECT 
        "movie_note_id",
        COUNT(*) AS "count"
    FROM "movie_note_orders"
    GROUP BY "movie_note_id"
) AS order_counts ON mn."id" = order_counts."movie_note_id"
WHERE mn."user_id" = @user_id::uuid
ORDER BY mn."created_at" DESC
LIMIT sqlc.arg('limit')::int;

-- Author: Egor Kuzmin (keelfy)
-- name: CountWatchedMovieNotesByUserId :one
SELECT COUNT(*) AS "count"
FROM "movie_notes"
WHERE "user_id" = @user_id::uuid
    AND "status" = 'watched';

-- Author: Egor Kuzmin (keelfy)
-- name: DeleteMovieNoteById :exec
DELETE FROM "movie_notes"
WHERE "id" = @id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateMovieNoteById :exec
UPDATE "movie_notes"
SET "updated_by" = @updated_by::uuid,
    "updated_at" = now(),
    "name" = @name::text,
    "release_date" = sqlc.narg('release_date')::timestamptz,
    "rate" = sqlc.narg('rate')::smallint,
    "comment" = sqlc.narg('comment')::text,
    "status" = @status::movie_note_status,
    "watched_at" = sqlc.narg('watched_at')::timestamptz,
    "poster_key" = sqlc.narg('poster_key')::text
WHERE "id" = @id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: UpdateMovieNoteName :one
UPDATE "movie_notes"
SET "name" = @name::text,
    "updated_by" = @updated_by::uuid,
    "updated_at" = now()
WHERE "id" = @id::uuid
RETURNING *;
