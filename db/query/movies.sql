-- name: UpsertMovie :one
INSERT INTO movies (
        external_id,
        release_date,
        websites,
        cover_key,
        cover_key_type,
        source_url,
        source_type
    )
VALUES (
        @external_id::bigint,
        sqlc.narg('release_date')::timestamptz,
        sqlc.narg('websites')::jsonb,
        sqlc.narg('cover_key')::text,
        sqlc.narg('cover_key_type')::image_key_type,
        sqlc.narg('source_url')::text,
        @source_type::content_source
    ) ON CONFLICT (external_id) DO
UPDATE
SET release_date = sqlc.narg('release_date')::timestamptz,
    cover_key = sqlc.narg('cover_key')::text,
    cover_key_type = sqlc.narg('cover_key_type')::image_key_type,
    source_url = sqlc.narg('source_url')::text,
    source_type = @source_type::content_source,
    updated_at = now()
RETURNING id;
-- name: UpsertMovieLocalization :exec
INSERT INTO movie_localizations (content_id, lang, title)
VALUES (
        @content_id::uuid,
        @lang::locale,
        @title::text
    ) ON CONFLICT (content_id, lang) DO
UPDATE
SET title = @title::text,
    updated_at = now();
-- name: DeleteMovie :exec
DELETE FROM movies
WHERE id = @id::uuid;
-- name: DeleteMovieLocalization :exec
DELETE FROM movie_localizations
WHERE content_id = @content_id::uuid
    AND lang = @lang::locale;
-- name: FindMovieByID :one
SELECT *
FROM movies
WHERE id = @id::uuid;
-- name: FindMovieByIDWithLocalization :one
SELECT movies.*,
    movie_localizations.title AS title
FROM movies
    JOIN movie_localizations ON movies.id = movie_localizations.content_id
    AND movie_localizations.lang = @lang::locale
WHERE movies.id = @id::uuid;