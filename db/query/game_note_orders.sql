-- name: InsertGameNoteOrder :one
INSERT INTO game_note_orders (
        game_note_id,
        order_id,
        created_by,
        updated_by
    )
VALUES (
        @game_note_id::uuid,
        @order_id::uuid,
        @created_by::uuid,
        @updated_by::uuid
    )
RETURNING *;
-- name: CountOrdersByGameNoteId :one
SELECT COUNT(*) AS total
FROM game_note_orders
WHERE game_note_id = @game_note_id::uuid;
-- name: ResetApprovedOrdersByGameNoteId :exec
UPDATE orders
SET status = 'pending'
WHERE id IN (
        SELECT order_id
        FROM game_note_orders
        WHERE game_note_id = @game_note_id::uuid
    );