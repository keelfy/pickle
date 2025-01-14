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

CREATE TYPE game_note_status AS ENUM (
    'planned',
    'playing',
    'paused',
    'dropped',
    'finished',
    'skipped'
);
