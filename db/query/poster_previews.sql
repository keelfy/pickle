-- name: InsertPosterPreview :one
INSERT INTO poster_previews (id, created_by, object_key)
VALUES (
        @id::uuid,
        @created_by::uuid,
        @object_key::text
    )
RETURNING *;
-- name: FindPosterPreviewById :one
SELECT *
FROM poster_previews
WHERE id = @id::uuid;
-- name: FindPosterPreviewByCreatedBy :many
SELECT *
FROM poster_previews
WHERE created_by = @created_by::uuid
ORDER BY created_at DESC;
-- name: FindPosterPreviewByCreatedAtAfterAndCreatedBy :many
SELECT *
FROM poster_previews
WHERE created_at > @created_at::timestamptz
    AND created_by = @created_by::uuid
ORDER BY created_at DESC
LIMIT sqlc.arg('limit')::int;
-- name: DeletePosterPreview :exec
DELETE FROM poster_previews
WHERE id = @id::uuid;