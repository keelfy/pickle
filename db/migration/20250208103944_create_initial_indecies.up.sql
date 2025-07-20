-- profiles
CREATE UNIQUE INDEX IF NOT EXISTS uidx_profiles_username ON profiles(username);
-- orderers
CREATE UNIQUE INDEX IF NOT EXISTS idx_orderers_user_id_reference_user_id_source ON orderers (user_id, reference_user_id, source);
-- orders
CREATE INDEX IF NOT EXISTS idx_orders_receiver_id ON orders(receiver_id);
-- game_notes
CREATE INDEX IF NOT EXISTS idx_game_notes_user_id ON game_notes(user_id);
-- es_migrations
CREATE UNIQUE INDEX IF NOT EXISTS uidx_es_migration_logs_name ON es_migration_logs(name);
-- followers
CREATE INDEX IF NOT EXISTS idx_followers_user_id ON followers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
-- poster_previews
CREATE INDEX IF NOT EXISTS idx_poster_previews_created_by ON poster_previews(created_by);
-- game_note_reactions
CREATE INDEX IF NOT EXISTS idx_game_note_reactions_game_note_id ON game_note_reactions(game_note_id);
-- collections
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_note_id ON collection_items(note_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_items_collection_id_note_id_category ON collection_items(collection_id, note_id, category);
-- moderation
CREATE INDEX IF NOT EXISTS idx_moderators_user_id ON moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_moderators_moderator_id ON moderators(moderator_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_moderators_user_id_moderator_id ON moderators(user_id, moderator_id);
-- movie_notes  
CREATE INDEX IF NOT EXISTS idx_movie_notes_user_id ON movie_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_note_orders_movie_note_id ON movie_note_orders(movie_note_id);
CREATE INDEX IF NOT EXISTS idx_movie_note_reactions_movie_note_id ON movie_note_reactions(movie_note_id);
-- games
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_external_id ON games(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_localizations_content_id_lang ON game_localizations(content_id, lang);
-- movies
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_external_id ON movies(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movie_localizations_content_id_lang ON movie_localizations(content_id, lang);
-- igdb sync
CREATE INDEX IF NOT EXISTS idx_igdb_sync_logs_completed_at ON igdb_sync_logs(completed_at);