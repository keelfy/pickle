package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const completeExternalSync = `
UPDATE external_sync_logs
SET status = 'completed',
	completed_at = now(),
	entities_processed = $1::bigint
WHERE id = $2
`

func (q *queries) CompleteExternalSync(ctx context.Context, logID uuid.UUID, entitiesProcessed int64) error {
	_, err := q.tx.Exec(ctx, completeExternalSync, entitiesProcessed, logID)
	return err
}

const completeExternalSyncWithError = `
UPDATE external_sync_logs
SET status = 'failed',
	completed_at = now(),
	error_message = $1::text
WHERE id = $2
`

func (q *queries) CompleteExternalSyncWithError(ctx context.Context, logID uuid.UUID, errorMessage string) error {
	_, err := q.tx.Exec(ctx, completeExternalSyncWithError, errorMessage, logID)
	return err
}

const createExternalSync = `
INSERT INTO external_sync_logs (sync_type, started_at, status)
VALUES (
	$1::external_sync_type,
	now(),
	'pending'
)
RETURNING id, sync_type, status, started_at, entities_processed, completed_at, error_message
`

func (q *queries) CreateExternalSync(ctx context.Context, syncType domain.SyncType) (*domain.ExternalSyncLog, error) {
	row := q.tx.QueryRow(ctx, createExternalSync, syncType)
	var i domain.ExternalSyncLog
	err := row.Scan(
		&i.ID,
		&i.SyncType,
		&i.Status,
		&i.StartedAt,
		&i.EntitiesProcessed,
		&i.CompletedAt,
		&i.ErrorMessage,
	)
	return &i, err
}

const getLastSuccessfulExternalSync = `
SELECT id, sync_type, status, started_at, entities_processed, completed_at, error_message
FROM external_sync_logs
WHERE sync_type = $1::external_sync_type
ORDER BY started_at DESC
LIMIT 1
`

func (q *queries) GetLastSuccessfulExternalSync(ctx context.Context, syncType domain.SyncType) (*domain.ExternalSyncLog, error) {
	row := q.tx.QueryRow(ctx, getLastSuccessfulExternalSync, syncType)
	var i domain.ExternalSyncLog
	err := row.Scan(
		&i.ID,
		&i.SyncType,
		&i.Status,
		&i.StartedAt,
		&i.EntitiesProcessed,
		&i.CompletedAt,
		&i.ErrorMessage,
	)
	return &i, err
}

const startExternalSync = `
UPDATE external_sync_logs
SET status = 'in_progress'
WHERE id = $1
`

func (q *queries) StartExternalSync(ctx context.Context, logID uuid.UUID) error {
	_, err := q.tx.Exec(ctx, startExternalSync, logID)
	return err
}
