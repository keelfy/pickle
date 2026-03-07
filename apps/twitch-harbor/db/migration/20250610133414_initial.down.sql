DROP TABLE IF EXISTS twitch_notifications;
DROP INDEX IF EXISTS idx_eventsub_subscriptions_identity_id;
DROP INDEX IF EXISTS idx_eventsub_subscriptions_connection_id;
DROP TABLE IF EXISTS eventsub_subscriptions;
DROP INDEX IF EXISTS idx_websocket_connections_identity_id;
DROP TABLE IF EXISTS websocket_connections;
DROP INDEX IF EXISTS idx_twitch_authorizations_broadcaster_id;
DROP TABLE IF EXISTS twitch_authorizations;
