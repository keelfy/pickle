package sql

import (
	"context"

	"github.com/pickle.pw/monolith/internal/domain"
)

const findElasticsearchMigrationByName = `
SELECT id, name, created_at
FROM es_migration_logs
WHERE name = $1::text
`

func (q *queries) FindElasticsearchMigrationByName(ctx context.Context, name string) (*domain.EsMigrationLog, error) {
	row := q.tx.QueryRow(ctx, findElasticsearchMigrationByName, name)
	var i domain.EsMigrationLog
	err := row.Scan(&i.ID, &i.Name, &i.CreatedAt)
	return &i, err
}

const insertElasticsearchMigration = `
INSERT INTO es_migration_logs (name, created_at)
VALUES ($1::text, now())
`

func (q *queries) InsertElasticsearchMigration(ctx context.Context, name string) error {
	_, err := q.tx.Exec(ctx, insertElasticsearchMigration, name)
	return err
}
