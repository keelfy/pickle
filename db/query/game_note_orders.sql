-- Author: Egor Kuzmin (keelfy)
-- name: InsertGameNoteOrder :one
INSERT INTO "game_note_orders" (
    "game_note_id",
    "order_id",
    "created_by",
    "updated_by"
) VALUES (
    $1,
    $2,
    $3,
    $4
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- name: CountOrdersByGameNoteId :one
SELECT COUNT(*) AS "total"
FROM "game_note_orders"
WHERE "game_note_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindPaginatedOrdersByGameNoteId :many
SELECT *
FROM "game_note_orders"
WHERE "game_note_id" = $1
ORDER BY "created_at" DESC
LIMIT $2
OFFSET $3;
