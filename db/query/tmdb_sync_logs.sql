-- name: CreateTMDBSync :one
INSERT INTO tmdb_sync_logs (sync_type, started_at, status)
VALUES (
        @sync_type::igdb_sync_type,
        now(),
        'pending'
    )
RETURNING *;

-- name: StartTMDBSync :exec
UPDATE tmdb_sync_logs
SET status = 'in_progress'
WHERE id = @id;

-- name: CompleteTMDBSyncWithError :exec
UPDATE tmdb_sync_logs
SET status = 'failed',
    completed_at = now(),
    error_message = @error_message::text
WHERE id = @id;

-- name: CompleteTMDBSync :exec
UPDATE tmdb_sync_logs
SET status = 'completed',
    completed_at = now(),
    movies_processed = @movies_processed::bigint
WHERE id = @id;

-- name: GetLastSuccessfulTMDBsync :one
SELECT *
FROM tmdb_sync_logs
WHERE sync_type = @sync_type::igdb_sync_type
ORDER BY started_at DESC
LIMIT 1; 