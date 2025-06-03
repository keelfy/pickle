DROP INDEX IF EXISTS idx_games_view_en;
DROP INDEX IF EXISTS idx_games_view_ru;

DROP MATERIALIZED VIEW IF EXISTS games_view_en;
DROP MATERIALIZED VIEW IF EXISTS games_view_ru;

DROP TABLE IF EXISTS game_localizations;

DROP INDEX IF EXISTS idx_games_igdb_id;
DROP TABLE IF EXISTS games;
