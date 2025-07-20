
-- MATERIALIZED VIEWS for localization

-- English
CREATE MATERIALIZED VIEW games_view_en AS
SELECT 
    g.id,
    g.external_id,
    COALESCE(gl.title, 'Unknown Title') as title,
    g.release_date,
    g.websites,
    g.created_at,
    g.updated_at
FROM games g
LEFT JOIN game_localizations gl ON g.id = gl.content_id AND gl.lang = 'en';

-- Russian
CREATE MATERIALIZED VIEW games_view_ru AS
SELECT 
    g.id,
    g.external_id,
    COALESCE(gl.title, 'Неизвестное название') as title,
    g.release_date,
    g.websites,
    g.created_at,
    g.updated_at
FROM games g
LEFT JOIN game_localizations gl ON g.id = gl.content_id AND gl.lang = 'ru';

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
