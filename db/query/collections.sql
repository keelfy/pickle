-- name: InsertCollection :one
INSERT INTO collections (
        created_by,
        updated_by,
        name,
        user_id
    )
VALUES (
        @created_by::uuid,
        @updated_by::uuid,
        @name::text,
        @user_id::uuid
    )
RETURNING *;
-- name: UpdateCollectionByID :one
UPDATE collections
SET name = @name::text,
    updated_by = @updated_by::uuid,
    updated_at = now()
WHERE id = @id::uuid
RETURNING *;
-- name: InsertCollectionItem :one
INSERT INTO collection_items (
        collection_id,
        note_id,
        content_id,
        category,
        created_by
    )
VALUES (
        @collection_id::uuid,
        @note_id::uuid,
        @content_id::uuid,
        @category::content_category,
        @created_by::uuid
    )
RETURNING *;
-- name: DeleteCollectionByID :exec
DELETE FROM collections
WHERE id = @id::uuid;
-- name: DeleteCollectionItemByID :exec
DELETE FROM collection_items
WHERE id = @id::uuid;
-- name: DeleteCollectionItemsByCollectionID :exec
DELETE FROM collection_items
WHERE collection_id = @collection_id::uuid;
-- name: FindCollectionByID :one
SELECT *
FROM collections
WHERE id = @id::uuid;
-- name: FindCollectionItemByID :one
SELECT *
FROM collection_items
WHERE id = @id::uuid;
-- name: FindCollectionItemsByCollectionID :many
SELECT *
FROM collection_items
WHERE collection_id = @collection_id::uuid;
-- name: FindCollectionsByUserID :many
SELECT *
FROM collections
WHERE user_id = @user_id::uuid;
-- name: FindCollectionItemsByUserID :many
SELECT ci.*
FROM collection_items ci
    INNER JOIN collections c ON ci.collection_id = c.id
WHERE c.user_id = @user_id::uuid;
-- name: CountCollectionItemsByCollectionID :one
SELECT COUNT(*)
FROM collection_items ci
    INNER JOIN collections c ON ci.collection_id = c.id
WHERE c.id = @id::uuid;
-- name: FindCollectionItemsByUserIDWithContentLimitPerCollection :many
WITH ranked_items AS (
    SELECT ci.*,
        CASE
            WHEN ci.category = 'games' THEN gl.title
            WHEN ci.category = 'movies' THEN ml.title
            ELSE NULL
        END AS content_title,
        CASE
            WHEN ci.category = 'games' THEN g.cover_key
            WHEN ci.category = 'movies' THEN m.cover_key
            ELSE NULL
        END AS cover_key,
        CASE
            WHEN ci.category = 'games' THEN g.cover_key_type
            WHEN ci.category = 'movies' THEN m.cover_key_type
            ELSE NULL
        END AS cover_key_type,
        ROW_NUMBER() OVER (
            PARTITION BY ci.collection_id
            ORDER BY ci.created_at DESC
        ) AS rn
    FROM collection_items ci
        INNER JOIN collections c ON ci.collection_id = c.id
        LEFT JOIN games g ON ci.category = 'games'
        AND ci.content_id = g.id
        LEFT JOIN game_localizations gl ON g.id = gl.content_id
        AND gl.lang = @lang::locale
        LEFT JOIN movies m ON ci.category = 'movies'
        AND ci.content_id = m.id
        LEFT JOIN movie_localizations ml ON m.id = ml.content_id
        AND ml.lang = @lang::locale
    WHERE c.user_id = @user_id::uuid
)
SELECT ri.*
FROM ranked_items ri
WHERE ri.rn <= sqlc.arg('limit')::smallint
ORDER BY ri.created_at DESC;
-- name: FindCollectionItemsByCollectionIDWithContent :many
SELECT ci.*,
    CASE
        WHEN ci.category = 'games' THEN gl.title
        WHEN ci.category = 'movies' THEN ml.title
        ELSE NULL
    END AS content_title,
    CASE
        WHEN ci.category = 'games' THEN g.cover_key
        WHEN ci.category = 'movies' THEN m.cover_key
        ELSE NULL
    END AS cover_key,
    CASE
        WHEN ci.category = 'games' THEN g.cover_key_type
        WHEN ci.category = 'movies' THEN m.cover_key_type
        ELSE NULL
    END AS cover_key_type
FROM collection_items ci
    INNER JOIN collections c ON ci.collection_id = c.id
    LEFT JOIN games g ON ci.category = 'games'
    AND ci.content_id = g.id
    LEFT JOIN game_localizations gl ON g.id = gl.content_id
    AND gl.lang = @lang::locale
    LEFT JOIN movies m ON ci.category = 'movies'
    AND ci.content_id = m.id
    LEFT JOIN movie_localizations ml ON m.id = ml.content_id
    AND ml.lang = @lang::locale
WHERE c.id = @collection_id::uuid
ORDER BY ci.created_at DESC
LIMIT sqlc.arg('limit')::int OFFSET sqlc.arg('offset')::int;