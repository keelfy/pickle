-- name: InsertOrder :one
INSERT INTO orders (
        created_by,
        updated_by,
        receiver_id,
        payment_type,
        amount,
        status,
        orderer_id,
        category,
        message,
        source,
        reference,
        anonymous
    )
VALUES (
        sqlc.narg('created_by')::uuid,
        sqlc.narg('updated_by')::uuid,
        @receiver_id::uuid,
        @payment_type::smallint,
        @amount::real,
        @status::order_status,
        @orderer_id::uuid,
        @category::content_category,
        @message::text,
        @source::text,
        @reference::jsonb,
        @anonymous::boolean
    )
RETURNING *;
-- name: FindOrderByID :one
SELECT o.*,
    orer.display_name AS orderer_display_name
FROM orders o
    LEFT JOIN orderers orer ON orer.id = o.orderer_id
WHERE o.id = @id::uuid;
-- name: CountOrdersByReceiverID :one
SELECT COUNT(*) AS total
FROM orders
WHERE receiver_id = @receiver_id::uuid;
-- name: FindOrdersByReceiverID :many
SELECT *
FROM orders
WHERE receiver_id = @receiver_id::uuid;
-- name: FindLastOrdersByReceiverID :many
SELECT o.id,
    o.created_at,
    o.payment_type,
    o.amount,
    o.status,
    o.message,
    o.category
FROM orders o
WHERE o.receiver_id = @receiver_id::uuid
ORDER BY o.created_at DESC
LIMIT sqlc.arg('limit')::bigint;
-- name: UpdateOrderByID :one
UPDATE orders
SET updated_at = now(),
    updated_by = @updated_by::uuid,
    status = @status::order_status
WHERE id = @id::uuid
RETURNING *;
-- name: FindPaginatedOrdersByGameNoteID :many
SELECT orders.*,
    orer.display_name AS orderer_display_name
FROM orders
    LEFT JOIN orderers orer ON orer.id = orders.orderer_id
    INNER JOIN game_note_orders ON game_note_orders.order_id = orders.id
    AND game_note_orders.game_note_id = @game_note_id::uuid
ORDER BY game_note_orders.created_at DESC
LIMIT sqlc.arg('limit')::bigint OFFSET sqlc.arg('offset')::bigint;
-- name: FindPaginatedOrdersByMovieNoteID :many
SELECT orders.*,
    orer.display_name AS orderer_display_name
FROM orders
    LEFT JOIN orderers orer ON orer.id = orders.orderer_id
    INNER JOIN movie_note_orders ON movie_note_orders.order_id = orders.id
    AND movie_note_orders.movie_note_id = @movie_note_id::uuid
ORDER BY movie_note_orders.created_at DESC
LIMIT sqlc.arg('limit')::bigint OFFSET sqlc.arg('offset')::bigint;