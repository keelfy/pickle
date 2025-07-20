-- igdb sync
DROP TABLE IF EXISTS igdb_sync_logs;

-- movies
DROP TABLE IF EXISTS movie_localizations;
DROP TABLE IF EXISTS movies;

-- games
DROP TABLE IF EXISTS game_localizations;
DROP TABLE IF EXISTS games;

-- movie_notes
DROP TABLE IF EXISTS movie_note_reactions;
DROP TABLE IF EXISTS movie_note_orders;
DROP TABLE IF EXISTS movie_notes;

-- game_notes
DROP TABLE IF EXISTS game_note_reactions;
DROP TABLE IF EXISTS game_note_orders;
DROP TABLE IF EXISTS game_notes;

-- moderators
DROP TABLE IF EXISTS moderators;

-- collections
DROP TABLE IF EXISTS collection_items;
DROP TABLE IF EXISTS collections;

DROP TABLE IF EXISTS es_migration_logs;
DROP TABLE IF EXISTS poster_previews;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS orderers;
DROP TABLE IF EXISTS profile_avatars;
DROP TABLE IF EXISTS followers;
DROP TABLE IF EXISTS profiles;
