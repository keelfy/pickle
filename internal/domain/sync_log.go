package domain

import (
	"time"

	"github.com/google/uuid"
)

type SyncType string

const (
	SyncTypeFull        SyncType = "full"
	SyncTypeIncremental SyncType = "incremental"
)

type SyncStatus string

const (
	SyncStatusPending    SyncStatus = "pending"
	SyncStatusInProgress SyncStatus = "in_progress"
	SyncStatusCompleted  SyncStatus = "completed"
	SyncStatusFailed     SyncStatus = "failed"
)

type ExternalSyncLog struct {
	ID                uuid.UUID
	SyncType          SyncType
	Status            SyncStatus
	StartedAt         time.Time
	EntitiesProcessed int64
	CompletedAt       *time.Time
	ErrorMessage      *string
}
