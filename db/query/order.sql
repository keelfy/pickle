-- Author: Egor Kuzmin (keelfy)
-- Inserts a new order
-- name: InsertOrder :one
INSERT INTO "orders" (
    "created_by",
    "updated_by",
    "receiver_id",
    "payment_type",
    "amount",
    "status",
    "ordered_by",
    "orderer_username",
    "category",
    "message"
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
    $10
)
RETURNING *;

-- Author: Egor Kuzmin (keelfy)
-- Queries order by id
-- name: FindOrderById :one
SELECT * FROM "orders" WHERE "id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- Counts orders by receiver id
-- name: CountOrdersByReceiverId :one
SELECT COUNT(*) AS "total" FROM "orders" WHERE "receiver_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- Queries orders by receiver id
-- name: FindOrdersByReceiverId :many
SELECT *
FROM "orders"
WHERE "receiver_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- Queries last orders by receiver id
-- name: FindLastOrdersByReceiverId :many
SELECT *
FROM "orders"
WHERE "receiver_id" = $1
ORDER BY "created_at" DESC
LIMIT $2;

-- Author: Egor Kuzmin (keelfy)
-- Updates order, updated_at and updated_by
-- name: UpdateOrderById :one
UPDATE "orders"
SET "updated_at" = $2,
    "updated_by" = $3,
    "status" = $4
WHERE "id" = $1
RETURNING *;
