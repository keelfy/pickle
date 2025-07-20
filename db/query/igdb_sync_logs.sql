-- name: CreateIGDBSync :one
INSERT INTO igdb_sync_logs (sync_type, started_at, status)
VALUES (
        @sync_type::igdb_sync_type,
        now(),
        'pending'
    )
RETURNING *;
-- name: StartIGDBSync :exec
UPDATE igdb_sync_logs
SET status = 'in_progress'
WHERE id = @id;
-- name: CompleteIGDBSyncWithError :exec
UPDATE igdb_sync_logs
SET status = 'failed',
    completed_at = now(),
    error_message = @error_message::text
WHERE id = @id;
-- name: CompleteIGDBSync :exec
UPDATE igdb_sync_logs
SET status = 'completed',
    completed_at = now(),
    games_processed = @games_processed::bigint
WHERE id = @id;
-- name: GetLastSuccessfulSync :one
SELECT *
FROM igdb_sync_logs
WHERE sync_type = @sync_type::igdb_sync_type
ORDER BY started_at DESC
LIMIT 1;