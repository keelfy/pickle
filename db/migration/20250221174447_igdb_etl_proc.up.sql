CREATE TYPE igdb_sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

CREATE TYPE igdb_sync_type AS ENUM ('full', 'incremental');

CREATE TABLE IF NOT EXISTS igdb_sync_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sync_type igdb_sync_type NOT NULL,
    status igdb_sync_status NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    games_processed bigint NOT NULL DEFAULT 0,
    completed_at timestamptz,
    error_message text,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_igdb_sync_logs_completed_at ON igdb_sync_logs(completed_at);
