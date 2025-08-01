-- ISO-639-1 language code
CREATE TYPE locale AS ENUM ('en', 'ru', 'de', 'es');
CREATE TYPE content_category AS ENUM (
    'games',
    'movies',
    'video',
    'anime',
    'series',
    'custom',
    'any'
);
CREATE TYPE order_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE image_key_type AS ENUM (
    'igdb',
    'tmdb',
    'custom'
);
CREATE TYPE reaction_source AS ENUM (
    'unicode_emoji',
    -- Standard Unicode emojis
    '7tv',
    -- 7TV emotes
    'custom' -- For future extensions (Twitch, BTTV, etc.)
);
CREATE TYPE game_note_status AS ENUM (
    'planned',
    'playing',
    'paused',
    'dropped',
    'finished',
    'skipped'
);
CREATE TYPE movie_note_status AS ENUM (
    'planned',
    'dropped',
    'watched',
    'skipped'
);
-- sync
CREATE TYPE igdb_sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE igdb_sync_type AS ENUM ('full', 'incremental');
-- content sources
CREATE TYPE content_source AS ENUM ('igdb', 'tmdb');