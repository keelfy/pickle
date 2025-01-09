-- Author: Egor Kuzmin (keelfy)
-- name: InsertMigration :exec
INSERT INTO "migration_logs" (name, created_at) VALUES ($1, now());

-- Author: Egor Kuzmin (keelfy)
-- name: InsertElasticsearchMigration :exec
INSERT INTO "es_migration_logs" (name, created_at) VALUES ($1, now());

-- Author: Egor Kuzmin (keelfy)
-- name: FindMigrationByName :one
SELECT * FROM "migration_logs" WHERE name = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: FindElasticsearchMigrationByName :one
SELECT * FROM "es_migration_logs" WHERE name = $1;
