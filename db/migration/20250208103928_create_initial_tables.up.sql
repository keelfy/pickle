CREATE TABLE IF NOT EXISTS es_migration_logs (
    id SERIAL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS profiles (
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid,
    display_name text NOT NULL,
    username text NOT NULL,
    description text NOT NULL DEFAULT '',
    links jsonb NOT NULL DEFAULT '[]',
    suggestion_preferences jsonb NOT NULL DEFAULT '{}',
    PRIMARY KEY (user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS profile_avatars (
    user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid,
    avatar_key text,
    avatar_url text,
    avatar_preview_key text,
    PRIMARY KEY (user_id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS followers (
    user_id uuid NOT NULL,
    follower_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, follower_id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (follower_id) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS orderers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid,
    user_id uuid,
    display_name text NOT NULL,
    source text NOT NULL,
    reference_user_id text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid,
    receiver_id uuid NOT NULL,
    orderer_id uuid NOT NULL,
    message text NOT NULL,
    category content_category NOT NULL,
    content_id uuid,
    anonymous boolean NOT NULL DEFAULT false,
    source text NOT NULL,
    reference jsonb NOT NULL DEFAULT '{}',
    PRIMARY KEY (id),
    FOREIGN KEY (receiver_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id),
    FOREIGN KEY (orderer_id) REFERENCES orderers(id)
);
CREATE TABLE IF NOT EXISTS order_decisions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    decided_at timestamptz NOT NULL DEFAULT now(),
    decided_by uuid NOT NULL,
    deleted_at timestamptz,
    deleted_by uuid,
    order_id uuid NOT NULL,
    content_note_id uuid,
    content_note_category content_category,
    status order_decision_status NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (decided_by) REFERENCES profiles(user_id),
    FOREIGN KEY (deleted_by) REFERENCES profiles(user_id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE TABLE IF NOT EXISTS poster_previews (
    id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    object_key text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS moderators (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    deleted_at timestamptz,
    deleted_by uuid,
    user_id uuid NOT NULL,
    moderator_id uuid NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (moderator_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (deleted_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS collections (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    name text NOT NULL,
    user_id uuid NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS collection_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL,
    note_id uuid NOT NULL,
    content_id uuid NOT NULL,
    category content_category NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (collection_id) REFERENCES collections(id),
    -- don't need it here because of any note can be of any category
    -- FOREIGN KEY (note_id) REFERENCES game_notes(id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS game_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    -- name text NOT NULL,
    -- link text,
    -- release_date timestamptz,
    rate smallint,
    comment text,
    initial_orderer_id uuid NOT NULL,
    status game_note_status NOT NULL DEFAULT('planned'),
    last_played_at timestamptz,
    -- poster_key text,
    -- poster_updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS game_note_reactions (
    content_note_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emote_id text NOT NULL,
    source reaction_source NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (content_note_id, user_id, emote_id, source),
    FOREIGN KEY (content_note_id) REFERENCES game_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS movie_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    -- name text NOT NULL,
    -- release_date timestamptz,
    rate smallint,
    comment text,
    status movie_note_status NOT NULL DEFAULT('planned'),
    initial_orderer_id uuid NOT NULL,
    watched_at timestamptz,
    -- poster_key text,
    -- poster_updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id),
    FOREIGN KEY (initial_orderer_id) REFERENCES orderers(id)
);
CREATE TABLE IF NOT EXISTS movie_note_reactions (
    content_note_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emote_id text NOT NULL,
    source reaction_source NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    PRIMARY KEY (content_note_id, user_id, emote_id, source),
    FOREIGN KEY (content_note_id) REFERENCES movie_notes(id),
    FOREIGN KEY (user_id) REFERENCES profiles(user_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id)
);
-- games
CREATE TABLE IF NOT EXISTS games (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    external_id bigint NOT NULL,
    release_date timestamptz,
    -- { "steam": "https://store.steampowered.com/app/1234567890/...", "epicgames": "https://www.epicgames.com/p/..." }
    websites jsonb,
    cover_key text,
    cover_key_type image_key_type,
    source_url text,
    source_type content_source NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS game_localizations (
    content_id uuid NOT NULL,
    locale text NOT NULL,
    title text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (content_id, locale),
    FOREIGN KEY (content_id) REFERENCES games(id)
);
-- movies
CREATE TABLE IF NOT EXISTS movies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    external_id bigint NOT NULL,
    release_date timestamptz,
    websites jsonb,
    cover_key text,
    cover_key_type image_key_type,
    source_url text,
    source_type content_source NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS movie_localizations (
    content_id uuid NOT NULL,
    locale text NOT NULL,
    title text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (content_id, locale),
    FOREIGN KEY (content_id) REFERENCES movies(id)
);
-- external sync
CREATE TABLE IF NOT EXISTS external_sync_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sync_type external_sync_type NOT NULL,
    status external_sync_status NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    entities_processed bigint NOT NULL DEFAULT 0,
    completed_at timestamptz,
    error_message text,
    PRIMARY KEY (id)
);