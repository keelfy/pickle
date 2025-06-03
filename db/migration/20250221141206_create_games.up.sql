CREATE TABLE IF NOT EXISTS games (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    igdb_id bigint NOT NULL,
    release_date timestamptz,
    websites jsonb NOT NULL, -- { "steam": "https://store.steampowered.com/app/1234567890/...", "epicgames": "https://www.epicgames.com/p/..." }
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_igdb_id ON games(igdb_id);

CREATE TABLE IF NOT EXISTS game_localizations (
    game_id uuid NOT NULL,
    lang text NOT NULL, -- ISO-639-1 language code
    title text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (game_id, lang),
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- MATERIALIZED VIEWS for localization

-- English
CREATE MATERIALIZED VIEW games_view_en AS
SELECT 
    g.id,
    g.igdb_id,
    COALESCE(gl.title, 'Unknown Title') as title,
    g.release_date,
    g.websites,
    g.created_at,
    g.updated_at
FROM games g
LEFT JOIN game_localizations gl ON g.id = gl.game_id AND gl.lang = 'en';

-- Russian
CREATE MATERIALIZED VIEW games_view_ru AS
SELECT 
    g.id,
    g.igdb_id,
    COALESCE(gl.title, 'Неизвестное название') as title,
    g.release_date,
    g.websites,
    g.created_at,
    g.updated_at
FROM games g
LEFT JOIN game_localizations gl ON g.id = gl.game_id AND gl.lang = 'ru';

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_view_en ON games_view_en(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_games_view_ru ON games_view_ru(id);

CREATE OR REPLACE FUNCTION refresh_all_game_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY games_view_en;
    REFRESH MATERIALIZED VIEW CONCURRENTLY games_view_ru;
    -- Add other locales here
END;
$$ LANGUAGE plpgsql;
