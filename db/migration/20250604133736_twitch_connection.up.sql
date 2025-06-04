CREATE TABLE IF NOT EXISTS twitch_connections (
    owner_id uuid NOT NULL REFERENCES profiles(user_id),
    broadcaster_id text NOT NULL,
    login text NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamptz NOT NULL,
    PRIMARY KEY (owner_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_twitch_connections_owner_id ON twitch_connections(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_twitch_connections_broadcaster_id ON twitch_connections(broadcaster_id);