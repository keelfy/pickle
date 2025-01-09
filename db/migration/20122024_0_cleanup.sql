DROP INDEX IF EXISTS "uidx_migration_logs_name";
DROP INDEX IF EXISTS "uidx_es_migration_logs_name";
DROP INDEX IF EXISTS "uidx_profiles_link";
DROP INDEX IF EXISTS "idx_orders_receiver_id";
DROP INDEX IF EXISTS "idx_game_notes_user_id";

DROP TABLE IF EXISTS "migration_logs";
DROP TABLE IF EXISTS "es_migration_logs";
DROP TABLE IF EXISTS "game_note_orders";
DROP TABLE IF EXISTS "game_notes";
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "orderers";
DROP TABLE IF EXISTS "profiles";
