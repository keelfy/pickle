-- name: InsertOrdererManually :one
INSERT INTO orderers (
        created_by,
        updated_by,
        user_id,
        display_name,
        source,
        reference_user_id
    )
VALUES (
        sqlc.narg('created_by')::uuid,
        sqlc.narg('updated_by')::uuid,
        sqlc.narg('user_id')::uuid,
        @display_name::text,
        @source::text,
        sqlc.narg('reference_user_id')::text
    ) ON CONFLICT (user_id, reference_user_id, source) DO
UPDATE
SET updated_at = now(),
    updated_by = sqlc.narg('updated_by')::uuid,
    display_name = @display_name::text,
    reference_user_id = sqlc.narg('reference_user_id')::text
RETURNING *;
-- name: InsertReferencedOrderer :one
INSERT INTO orderers (
        created_by,
        updated_by,
        user_id,
        display_name,
        source,
        reference_user_id
    )
VALUES (
        sqlc.narg('created_by')::uuid,
        sqlc.narg('updated_by')::uuid,
        sqlc.narg('user_id')::uuid,
        @display_name::text,
        @source::text,
        sqlc.narg('reference_user_id')::text
    ) ON CONFLICT (user_id, reference_user_id, source) DO
UPDATE
SET updated_at = now(),
    updated_by = sqlc.narg('updated_by')::uuid,
    display_name = @display_name::text
RETURNING *;
-- name: FindOrdererByID :one
SELECT *
FROM orderers
WHERE id = @id::uuid;
-- name: FindOrdererByUserID :one
SELECT *
FROM orderers
WHERE user_id = @user_id::uuid;
-- name: FindOrdererBySourceAndReferenceUserID :one
SELECT *
FROM orderers
WHERE source = @source::text
    AND reference_user_id = @reference_user_id::text;
-- name: UpdateOrdererByUserID :exec
UPDATE orderers
SET updated_at = now(),
    updated_by = @updated_by::uuid,
    display_name = @display_name::text,
    source = @source::text,
    reference_user_id = @reference_user_id::text
WHERE user_id = @user_id::uuid;