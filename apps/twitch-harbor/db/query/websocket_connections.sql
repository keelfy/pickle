-- name: InsertWebsocketConnection :one
INSERT INTO websocket_connections (id, status, identity_id)
VALUES (@id::uuid, @status::text, @identity_id::uuid)
RETURNING *;
-- name: FindWebsocketConnectionByID :one
SELECT *
FROM websocket_connections
WHERE id = @id::uuid;
-- name: UpdateWebsocketConnection :one
UPDATE websocket_connections
SET updated_at = NOW(),
    status = CASE
        WHEN @status::text != '' THEN @status::text
        ELSE status
    END,
    session_id = CASE
        WHEN @session_id::text != '' THEN @session_id::text
        ELSE session_id
    END,
    last_ping = CASE
        WHEN @last_ping::timestamptz != to_timestamp(0) THEN @last_ping::timestamptz
        ELSE last_ping
    END,
    error_count = CASE
        WHEN @error_count::int != 0 THEN @error_count::int
        ELSE error_count
    END,
    error_message = CASE
        WHEN @error_message::text != '' THEN @error_message::text
        ELSE error_message
    END
WHERE id = @id::uuid
RETURNING *;
-- name: FindWebsocketConnectionsToRestore :many
SELECT id
FROM websocket_connections
WHERE status IN ('active', 'connecting')
    AND updated_at < NOW() - INTERVAL '5' MINUTE;
-- name: UpdateWebsocketConnectionStatus :exec
UPDATE websocket_connections
SET status = @status::text,
    updated_at = NOW()
WHERE id = @id::uuid;
-- name: UpdateWebsocketConnectionSubscriptionCount :exec
UPDATE websocket_connections
SET subscription_count = @subscription_count::int,
    updated_at = NOW()
WHERE id = @id::uuid;
-- name: FindAvailableWebsocketConnectionsToSubscribe :many
SELECT wc.*,
    100 - subscription_count AS free_slots
FROM websocket_connections wc
WHERE wc.status = 'active'
    AND wc.session_id IS NOT NULL
    AND wc.session_id != ''
    AND wc.subscription_count < 100 FOR
UPDATE;