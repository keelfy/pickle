-- name: InsertElasticsearchMigration :exec
INSERT INTO "es_migration_logs" (name, created_at) VALUES ($1, now());

-- name: FindElasticsearchMigrationByName :one
SELECT * FROM "es_migration_logs" WHERE name = $1;
