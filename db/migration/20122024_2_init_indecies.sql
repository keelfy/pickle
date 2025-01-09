-- Author: Egor Kuzmin (keelfy)

-- profiles
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_profiles_link" ON "profiles"("link");

-- orders
CREATE INDEX IF NOT EXISTS "idx_orders_receiver_id" ON "orders"("receiver_id");

-- game_notes
CREATE INDEX IF NOT EXISTS "idx_game_notes_user_id" ON "game_notes"("user_id");

-- migrations
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_migration_logs_name" ON "migration_logs"("name");

-- es_migrations
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_es_migration_logs_name" ON "es_migration_logs"("name");
