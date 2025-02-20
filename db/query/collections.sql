-- name: InsertCollection :one
INSERT INTO "collections" (
    "created_by", 
    "updated_by", 
    "name", 
    "user_id"
) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateCollectionByID :one
UPDATE "collections" 
SET "name" = $2,
    "updated_by" = $3,
    "updated_at" = now()
WHERE "id" = $1
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

-- name: DeleteCollectionItemsByCollectionID :exec
DELETE 
FROM "collection_items" 
WHERE "collection_id" = $1;

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

-- name: CountCollectionItemsByCollectionID :one
SELECT COUNT(*)
FROM "collection_items" ci
INNER JOIN "collections" c ON ci."collection_id" = c."id"
WHERE c."id" = $1;

-- name: FindCollectionItemsByUserIDWithContentLimitPerCollection :many
WITH "ranked_items" AS (
    SELECT 
        ci.*,
        CASE
            WHEN ci."category" = 'games' THEN g."name"
            WHEN ci."category" = 'movies' THEN m."name"
            ELSE NULL
        END AS "content_name",
        CASE 
            WHEN ci."category" = 'games' THEN g."poster_key"
            WHEN ci."category" = 'movies' THEN m."poster_key"
            ELSE NULL
        END AS "poster_key",
        CASE 
            WHEN ci."category" = 'games' THEN g."poster_updated_at"
            WHEN ci."category" = 'movies' THEN m."poster_updated_at"
            ELSE NULL
        END AS "poster_updated_at",
        ROW_NUMBER() OVER (PARTITION BY ci."collection_id" ORDER BY ci."created_at" DESC) AS "rn"
    FROM "collection_items" ci
    INNER JOIN "collections" c ON ci."collection_id" = c."id"
    LEFT JOIN "game_notes" g ON ci."category" = 'games' AND ci."note_id" = g."id"
    LEFT JOIN "movie_notes" m ON ci."category" = 'movies' AND ci."note_id" = m."id"
    WHERE c."user_id" = @user_id::uuid
)
SELECT ri.*
FROM "ranked_items" ri
WHERE ri."rn" <= sqlc.arg('limit')::smallint
ORDER BY ri."created_at" DESC;

-- SELECT
--     ci.*,
--     CASE
--         WHEN ci."category" = 'games' THEN g."name"
--         -- WHEN ci."category" = 'movie' THEN m."name"
--         -- WHEN ci."category" = 'anime' THEN a."name"
--         -- WHEN ci."category" = 'book' THEN b."name"
--         -- WHEN ci."category" = 'song' THEN s."name"
--         ELSE NULL
--     END AS "content_name",
--     CASE 
--         WHEN ci."category" = 'games' THEN g."poster_key"
--         ELSE NULL
--     END AS "poster_key",
--     CASE 
--         WHEN ci."category" = 'games' THEN g."poster_updated_at"
--         ELSE NULL
--     END AS "poster_updated_at"
-- FROM "collection_items" ci
-- INNER JOIN "collections" c ON ci."collection_id" = c."id"
-- LEFT JOIN "game_notes" g ON ci."category" = 'games' AND ci."note_id" = g."id"
-- WHERE c."user_id" = $1
-- ORDER BY ci."created_at" DESC
-- LIMIT $2;
-- LEFT JOIN
--     MovieNote m ON ci."category" = 'movie' AND ci."note_id" = m."id"
-- LEFT JOIN
--     AnimeNote a ON ci."category" = 'anime' AND ci."note_id" = a."id"
-- LEFT JOIN
--     BookNote b ON ci."category" = 'book' AND ci."note_id" = b."id"
-- LEFT JOIN
--     SongNote s ON ci."category" = 'song' AND ci."note_id" = s."id"
-- LEFT JOIN
--     ArticleNote ar ON ci."category" = 'article' AND ci."note_id" = ar."id";

-- name: FindCollectionItemsByCollectionIDWithContent :many
SELECT
    ci.*,
    CASE
        WHEN ci."category" = 'games' THEN g."name"
        -- WHEN ci."category" = 'movie' THEN m."name"
        -- WHEN ci."category" = 'anime' THEN a."name"
        -- WHEN ci."category" = 'book' THEN b."name"
        -- WHEN ci."category" = 'song' THEN s."name"
        ELSE NULL
    END AS "content_name",
    CASE 
        WHEN ci."category" = 'games' THEN g."poster_key"
        ELSE NULL
    END AS "poster_key",
    CASE 
        WHEN ci."category" = 'games' THEN g."poster_updated_at"
        ELSE NULL
    END AS "poster_updated_at"
FROM "collection_items" ci
INNER JOIN "collections" c ON ci."collection_id" = c."id"
LEFT JOIN "game_notes" g ON ci."category" = 'games' AND ci."note_id" = g."id"
WHERE c."id" = @collection_id::uuid
ORDER BY ci."created_at" DESC
LIMIT sqlc.arg('limit')::int
OFFSET sqlc.arg('offset')::int;
