-- name: InsertElasticsearchMigration :exec
INSERT INTO es_migration_logs (name, created_at)
VALUES (@name::text, now());
-- name: FindElasticsearchMigrationByName :one
SELECT *
FROM es_migration_logs
WHERE name = @name::text;