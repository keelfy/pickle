-- name: InsertCollection :one
INSERT INTO "collections" (
    "created_by", 
    "updated_by", 
    "name", 
    "user_id"
) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: InsertCollectionItem :one
INSERT INTO "collection_items" (
    "collection_id", 
    "note_id", 
    "category",
    "created_by"
) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteCollectionByID :exec
DELETE 
FROM "collections" 
WHERE "id" = $1;

-- name: DeleteCollectionItemByID :exec
DELETE 
FROM "collection_items" 
WHERE "id" = $1;

-- name: FindCollectionByID :one
SELECT * 
FROM "collections" 
WHERE "id" = $1;

-- name: FindCollectionItemByID :one
SELECT * 
FROM "collection_items" 
WHERE "id" = $1;

-- name: FindCollectionItemsByCollectionID :many
SELECT * 
FROM "collection_items" 
WHERE "collection_id" = $1;

-- name: FindCollectionsByUserID :many
SELECT * 
FROM "collections" 
WHERE "user_id" = $1;

-- name: FindCollectionItemsByUserID :many
SELECT ci.* 
FROM "collection_items" ci
INNER JOIN "collections" c ON ci."collection_id" = c."id"
WHERE c."user_id" = $1;
