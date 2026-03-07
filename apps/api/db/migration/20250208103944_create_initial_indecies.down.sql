-- external sync
DROP INDEX IF EXISTS idx_external_sync_logs_completed_at;
-- movies
DROP INDEX IF EXISTS idx_movies_external_id_source_type;
DROP INDEX IF EXISTS idx_movie_localizations_content_id_locale;
-- games
DROP INDEX IF EXISTS idx_games_external_id_source_type;
DROP INDEX IF EXISTS idx_game_localizations_content_id_locale;
-- movie_notes
DROP INDEX IF EXISTS idx_movie_note_reactions_content_note_id;
DROP INDEX IF EXISTS idx_movie_notes_user_id;
-- game_notes
DROP INDEX IF EXISTS idx_game_note_reactions_content_note_id;
DROP INDEX IF EXISTS idx_game_notes_user_id;
-- order_decisions
DROP INDEX IF EXISTS idx_order_decisions_order_id_deleted_by;
DROP INDEX IF EXISTS idx_order_decisions_content_note_id_content_note_category_deleted_by;
DROP INDEX IF EXISTS idx_order_decisions_order_id_content_note_id_content_note_category_deleted_by;
-- orderers
DROP INDEX IF EXISTS idx_orderers_source_reference_user_id;
DROP INDEX IF EXISTS idx_orderers_source_user_id;
DROP INDEX IF EXISTS idx_orderers_user_id_reference_user_id_source;
-- orders
DROP INDEX IF EXISTS idx_orders_receiver_id;
-- moderation
DROP INDEX IF EXISTS idx_moderators_moderator_id;
DROP INDEX IF EXISTS idx_moderators_user_id;
DROP INDEX IF EXISTS idx_moderators_user_id_moderator_id;
-- collections
DROP INDEX IF EXISTS idx_collection_items_collection_id;
DROP INDEX IF EXISTS idx_collection_items_note_id;
DROP INDEX IF EXISTS idx_collection_items_collection_id_note_id_category;
DROP INDEX IF EXISTS idx_collections_user_id;
DROP INDEX IF EXISTS uidx_es_migration_logs_name;
DROP INDEX IF EXISTS uidx_profiles_username;
DROP INDEX IF EXISTS idx_followers_user_id;
DROP INDEX IF EXISTS idx_followers_follower_id;