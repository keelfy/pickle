-- profiles
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_profiles_link" ON "profiles"("link");

-- orders
CREATE INDEX IF NOT EXISTS "idx_orders_receiver_id" ON "orders"("receiver_id");

-- game_notes
CREATE INDEX IF NOT EXISTS "idx_game_notes_user_id" ON "game_notes"("user_id");

-- es_migrations
CREATE UNIQUE INDEX IF NOT EXISTS "uidx_es_migration_logs_name" 
ON "es_migration_logs"("name");

-- followers
CREATE INDEX IF NOT EXISTS "idx_followers_user_id" 
ON "followers"("user_id");
CREATE INDEX IF NOT EXISTS "idx_followers_follower_id" 
ON "followers"("follower_id");

-- poster_previews
CREATE INDEX IF NOT EXISTS "idx_poster_previews_created_by" 
ON "poster_previews"("created_by");

-- game_note_reactions
CREATE INDEX IF NOT EXISTS "idx_game_note_reactions_game_note_id" 
ON "game_note_reactions"("game_note_id");
