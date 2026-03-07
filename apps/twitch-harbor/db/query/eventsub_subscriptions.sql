-- name: InsertEventsubSubscription :one
INSERT INTO eventsub_subscriptions (
        id,
        identity_id,
        event_type
    )
VALUES (
        gen_random_uuid(),
        @identity_id::uuid,
        @event_type::text
    ) ON CONFLICT (id) DO
UPDATE
SET identity_id = @identity_id::uuid,
    event_type = @event_type::text
RETURNING *;
-- name: UpdateEventsubSubscriptionStatus :exec
UPDATE eventsub_subscriptions
SET status = @status::text,
    reference_id = @reference_id::text,
    updated_at = NOW()
WHERE id = @id::uuid;
-- name: UpdateEventsubSubscriptionConnectionID :exec
UPDATE eventsub_subscriptions
SET connection_id = @connection_id::uuid,
    updated_at = NOW(),
    status = @status::text
WHERE id = @id::uuid;
-- name: UpdateEventsubSubscriptionsStatusByConnectionID :exec
UPDATE eventsub_subscriptions
SET status = @status::text,
    updated_at = NOW()
WHERE connection_id = @connection_id::uuid;
-- name: FindEventsubSubscriptionByIdentityID :many
SELECT *
FROM eventsub_subscriptions
WHERE identity_id = @identity_id::uuid;
-- name: FindEventSubscriptionsByStatus :many
SELECT *
FROM eventsub_subscriptions
WHERE status = @status::text;
-- name: FindPendingEventSubscriptions :many
SELECT es.*
FROM eventsub_subscriptions es
LEFT JOIN websocket_connections wc ON wc.id = es.connection_id
WHERE es.status = 'pending' OR (
    es.status IN ('subscribed', 'assigned')
    AND (wc.status IN ('closed', 'error') OR wc.status IS NULL)
);
-- name: FindEventsubSubscriptionsByConnectionID :many
SELECT *
FROM eventsub_subscriptions
WHERE connection_id = @connection_id::uuid;
-- name: FindEventsubSubscriptionsAssignedToConnectionID :many
SELECT *
FROM eventsub_subscriptions
WHERE connection_id = @connection_id::uuid
    AND status = 'assigned';
-- name: FindEventsubSubscriptionByReferenceID :one
SELECT *
FROM eventsub_subscriptions
WHERE reference_id = @reference_id::text;
-- name: FindActiveSubscriptionsByEventType :many
SELECT es.*
FROM eventsub_subscriptions es
LEFT JOIN websocket_connections wc ON wc.id = es.connection_id
WHERE event_type = @event_type::text
    AND es.status = 'subscribed'
    AND es.connection_id IS NOT NULL
    AND wc.updated_at >= NOW() - INTERVAL '5 minutes'
    AND wc.status = 'active'
    AND es.identity_id = @identity_id::uuid;