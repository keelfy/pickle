-- tmdb sync
CREATE TABLE IF NOT EXISTS tmdb_sync_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sync_type igdb_sync_type NOT NULL,
    status igdb_sync_status NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    movies_processed bigint NOT NULL DEFAULT 0,
    completed_at timestamptz,
    error_message text,
    PRIMARY KEY (id)
);

DROP INDEX IF EXISTS idx_games_external_id;
DROP INDEX IF EXISTS idx_movies_external_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_external_id_source_type ON games(external_id, source_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_external_id_source_type ON movies(external_id, source_type);

ALTER TABLE movie_localizations
ALTER COLUMN lang TYPE text;

DROP INDEX IF EXISTS idx_games_view_en;
DROP INDEX IF EXISTS idx_games_view_ru;

DROP MATERIALIZED VIEW IF EXISTS games_view_en;
DROP MATERIALIZED VIEW IF EXISTS games_view_ru;

ALTER TABLE game_localizations
ALTER COLUMN lang TYPE text;