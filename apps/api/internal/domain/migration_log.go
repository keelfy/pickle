package domain

import "time"

type EsMigrationLog struct {
	ID        int32
	Name      string
	CreatedAt time.Time
}
