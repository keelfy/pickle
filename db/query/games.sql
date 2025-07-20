-- name: UpsertGame :one
INSERT INTO games (
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
    websites = sqlc.narg('websites')::jsonb,
    cover_key = sqlc.narg('cover_key')::text,
    cover_key_type = sqlc.narg('cover_key_type')::image_key_type,
    source_url = sqlc.narg('source_url')::text,
    source_type = @source_type::content_source,
    updated_at = now()
RETURNING id;
-- name: UpsertGameLocalization :exec
INSERT INTO game_localizations (content_id, lang, title)
VALUES (
        @content_id::uuid,
        @lang::locale,
        @title::text
    ) ON CONFLICT (content_id, lang) DO
UPDATE
SET title = @title::text,
    updated_at = now();
-- name: DeleteGame :exec
DELETE FROM games
WHERE id = @id::uuid;
-- name: DeleteGameLocalization :exec
DELETE FROM game_localizations
WHERE content_id = @content_id::uuid
    AND lang = @lang::locale;
-- name: RefreshLocalizedGameViews :exec
SELECT refresh_all_game_views();
-- name: FindGameByID :one
SELECT *
FROM games
WHERE id = @id::uuid;
-- name: FindGameByIDWithLocalization :one
SELECT games.*,
    game_localizations.title
FROM games
    INNER JOIN game_localizations ON games.id = game_localizations.content_id
    AND game_localizations.lang = @lang::locale
WHERE games.id = @id::uuid;