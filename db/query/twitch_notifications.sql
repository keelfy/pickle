-- name: InsertTwitchNotification :one
INSERT INTO "twitch_notifications" (
    "identity_id",
    "subscription_id",
    "message_type",
    "payload",
    "status"
) VALUES (
    @identity_id::uuid,
    sqlc.narg('subscription_id')::uuid,
    @message_type::text,
    @payload::jsonb,
    @status::text
)
RETURNING *;
-- name: UpdateTwitchNotificationStatus :exec
UPDATE "twitch_notifications"
SET "status" = @status::text,
    "retry_count" = @retry_count::int,
    "updated_at" = now()
WHERE "id" = @id::uuid;