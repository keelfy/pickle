DROP FUNCTION IF EXISTS refresh_all_movie_views();

DROP INDEX IF EXISTS idx_movies_view_en;
DROP INDEX IF EXISTS idx_movies_view_ru;

DROP MATERIALIZED VIEW IF EXISTS movies_view_en;
DROP MATERIALIZED VIEW IF EXISTS movies_view_ru;

DROP TABLE IF EXISTS movie_localizations;

DROP INDEX IF EXISTS idx_movies_tmdb_id;
DROP TABLE IF EXISTS movies;
