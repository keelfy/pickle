-- name: UpsertMovie :one
INSERT INTO movies (
    external_id,
    release_date,
    websites,
    cover_key,
    cover_key_type,
    source_url,
    source_type
) VALUES (
    @external_id,
    sqlc.narg('release_date')::timestamptz,
    sqlc.narg('websites')::jsonb,
    sqlc.narg('cover_key')::text,
    sqlc.narg('cover_key_type')::image_key_type,
    sqlc.narg('source_url')::text,
    @source_type
)
ON CONFLICT (external_id, source_type) DO UPDATE SET
    release_date = EXCLUDED.release_date,
    websites = EXCLUDED.websites,
    cover_key = EXCLUDED.cover_key,
    cover_key_type = EXCLUDED.cover_key_type,
    source_url = EXCLUDED.source_url,
    updated_at = now()
RETURNING id;

-- name: UpsertMovieLocalization :exec
INSERT INTO movie_localizations (
    content_id,
    lang,
    title
) VALUES (
    @content_id::uuid,
    @lang::text,
    @title::text
)
ON CONFLICT (content_id, lang) DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = now();

-- name: RefreshLocalizedMovieViews :exec
-- REFRESH MATERIALIZED VIEW CONCURRENTLY localized_movies;
-- name: DeleteMovie :exec
DELETE FROM movies
WHERE id = @id::uuid;
-- name: DeleteMovieLocalization :exec
DELETE FROM movie_localizations
WHERE content_id = @content_id::uuid
    AND lang = @lang::text;
-- name: FindMovieByID :one
SELECT *
FROM movies
WHERE id = @id::uuid;
-- name: FindMovieByIDWithLocalization :one
SELECT movies.*,
    movie_localizations.title AS title
FROM movies
    JOIN movie_localizations ON movies.id = movie_localizations.content_id
    AND movie_localizations.lang = @lang::text
WHERE movies.id = @id::uuid;