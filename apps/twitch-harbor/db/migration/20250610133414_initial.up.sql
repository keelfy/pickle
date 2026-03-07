CREATE TABLE IF NOT EXISTS "twitch_authorizations" (
    identity_id uuid NOT NULL PRIMARY KEY,
    broadcaster_id text NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_twitch_authorizations_broadcaster_id ON "twitch_authorizations"(broadcaster_id);
CREATE TABLE IF NOT EXISTS "websocket_connections" (
    id uuid PRIMARY KEY,
    session_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_ping timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'connecting',
    error_count INT NOT NULL DEFAULT 0,
    error_message text NOT NULL DEFAULT '',
    subscription_count INT NOT NULL DEFAULT 0,
    -- websocket connection is assigned to specific identity
    identity_id uuid NOT NULL REFERENCES "twitch_authorizations"(identity_id)
);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_identity_id ON "websocket_connections"(identity_id);
CREATE TABLE IF NOT EXISTS "eventsub_subscriptions" (
    id uuid PRIMARY KEY,
    connection_id uuid REFERENCES "websocket_connections"(id),
    identity_id uuid NOT NULL REFERENCES "twitch_authorizations"(identity_id),
    -- subscription id from twitch
    reference_id text,
    event_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_eventsub_subscriptions_connection_id ON "eventsub_subscriptions"(connection_id);
CREATE INDEX IF NOT EXISTS idx_eventsub_subscriptions_identity_id ON "eventsub_subscriptions"(identity_id);
CREATE TABLE IF NOT EXISTS "broadcaster_tracked_rewards" (
    broadcaster_id text,
    tracked_reward_id text NOT NULL,
    category text NOT NULL DEFAULT 'any',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (broadcaster_id, tracked_reward_id)
);
CREATE INDEX IF NOT EXISTS idx_broadcaster_tracked_rewards_broadcaster_id ON "broadcaster_tracked_rewards"(broadcaster_id);
CREATE TABLE IF NOT EXISTS "twitch_notifications" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id uuid NOT NULL REFERENCES "twitch_authorizations"(identity_id),
    subscription_id uuid REFERENCES "eventsub_subscriptions"(id),
    message_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    retry_count INT NOT NULL DEFAULT 0,
    status text NOT NULL
);