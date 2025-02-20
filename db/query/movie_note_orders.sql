-- Author: Egor Kuzmin (keelfy)
-- name: InsertMovieNoteOrder :one
INSERT INTO "movie_note_orders" (
    "movie_note_id",
    "order_id",
    "created_by"
) VALUES (
    @movie_note_id::uuid,
    @order_id::uuid,
    @created_by::uuid
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: CountOrdersByMovieNoteId :one
SELECT COUNT(*) AS "total"
FROM "movie_note_orders"
WHERE "movie_note_id" = @movie_note_id::uuid;

-- Author: Egor Kuzmin (keelfy)
-- name: ResetApprovedOrdersByMovieNoteId :exec
UPDATE "orders"
SET "status" = 'pending'
WHERE "id" IN (
    SELECT "order_id"
    FROM "movie_note_orders"
    WHERE "movie_note_id" = @movie_note_id::uuid
);
