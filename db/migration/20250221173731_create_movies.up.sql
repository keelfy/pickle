CREATE TABLE IF NOT EXISTS movies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tmdb_id bigint NOT NULL,
    title text NOT NULL,
    release_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);

CREATE TABLE IF NOT EXISTS movie_localizations (
    movie_id uuid NOT NULL,
    lang text NOT NULL, -- ISO-639-1 language code
    title text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (movie_id, lang),
    FOREIGN KEY (movie_id) REFERENCES movies(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_movie_localizations_movie_id_lang ON movie_localizations(movie_id, lang);

-- English
CREATE MATERIALIZED VIEW IF NOT EXISTS movies_view_en AS
SELECT 
    m.id,
    m.tmdb_id,
    COALESCE(ml.title, 'Unknown Title') as title
FROM movies m
LEFT JOIN movie_localizations ml ON m.id = ml.movie_id AND ml.lang = 'en';

-- Russian
CREATE MATERIALIZED VIEW IF NOT EXISTS movies_view_ru AS
SELECT 
    m.id,
    m.tmdb_id,
    COALESCE(ml.title, 'Неизвестное название') as title
FROM movies m
LEFT JOIN movie_localizations ml ON m.id = ml.movie_id AND ml.lang = 'ru';

CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_view_en ON movies_view_en(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_view_ru ON movies_view_ru(id);

CREATE OR REPLACE FUNCTION refresh_all_movie_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY movies_view_en;
    REFRESH MATERIALIZED VIEW CONCURRENTLY movies_view_ru;
END;
$$ LANGUAGE plpgsql;