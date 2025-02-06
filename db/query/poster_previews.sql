-- name: InsertPosterPreview :one
INSERT INTO "poster_previews" (
    "id",
    "created_by",
    "object_key"
) VALUES (
    $1,
    $2,
    $3
)
RETURNING *;

-- name: FindPosterPreviewById :one
SELECT * FROM "poster_previews" WHERE "id" = $1;

-- name: FindPosterPreviewByCreatedBy :many
SELECT * 
FROM "poster_previews" 
WHERE "created_by" = $1
ORDER BY "created_at" DESC;

-- name: FindPosterPreviewByCreatedAtAfterAndCreatedBy :many
SELECT * 
FROM "poster_previews" 
WHERE "created_at" > $1 
    AND "created_by" = $2
ORDER BY "created_at" DESC
LIMIT 5;

-- name: DeletePosterPreview :exec
DELETE FROM "poster_previews" WHERE "id" = $1;
