DROP INDEX IF EXISTS "uidx_migration_logs_name";
DROP INDEX IF EXISTS "uidx_es_migration_logs_name";
DROP INDEX IF EXISTS "uidx_profiles_link";
DROP INDEX IF EXISTS "idx_orders_receiver_id";
DROP INDEX IF EXISTS "idx_game_notes_user_id";
DROP INDEX IF EXISTS "idx_followers_user_id";
DROP INDEX IF EXISTS "idx_followers_follower_id";

DROP TABLE IF EXISTS "migration_logs";
DROP TABLE IF EXISTS "es_migration_logs";
DROP TABLE IF EXISTS "poster_previews";
DROP TABLE IF EXISTS "game_note_orders";
DROP TABLE IF EXISTS "game_notes";
DROP TABLE IF EXISTS "orders";
DROP TABLE IF EXISTS "orderers";
DROP TABLE IF EXISTS "profile_avatars";
DROP TABLE IF EXISTS "followers";
DROP TABLE IF EXISTS "profiles";

DROP TYPE IF EXISTS "content_category";
DROP TYPE IF EXISTS "order_status";
DROP TYPE IF EXISTS "game_note_status";
