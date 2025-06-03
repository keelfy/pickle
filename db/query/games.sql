-- name: UpsertGame :one
INSERT INTO games (
    igdb_id,
    release_date,
    websites
) VALUES (
    @igdb_id::bigint,
    @release_date::timestamptz,
    @websites::jsonb
) ON CONFLICT (igdb_id) DO 
UPDATE SET 
    release_date = @release_date::timestamptz, 
    websites = @websites::jsonb,
    updated_at = now()
RETURNING id;

-- name: UpsertGameLocalization :exec
INSERT INTO game_localizations (
    game_id,
    lang,
    title
) VALUES (
    @game_id::uuid,
    @lang::text,
    @title::text
) ON CONFLICT (game_id, lang) DO 
UPDATE SET 
    title = @title::text,
    updated_at = now();

-- name: DeleteGame :exec
DELETE FROM games WHERE id = @id::uuid;

-- name: DeleteGameLocalization :exec
DELETE FROM game_localizations WHERE game_id = @game_id::uuid AND lang = @lang::text;

-- name: RefreshLocalizedGameViews :exec
SELECT refresh_all_game_views();
