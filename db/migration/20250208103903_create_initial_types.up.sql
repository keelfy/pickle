CREATE TYPE content_category AS ENUM (
    'games',
    'movies',
    'video',
    'anime',
    'series',
    'custom'
);

CREATE TYPE order_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE reaction_source AS ENUM (
    'unicode_emoji',  -- Standard Unicode emojis
    '7tv',           -- 7TV emotes
    'custom'         -- For future extensions (Twitch, BTTV, etc.)
);

CREATE TYPE game_note_status AS ENUM (
    'planned',
    'playing',
    'paused',
    'dropped',
    'finished',
    'skipped'
);
