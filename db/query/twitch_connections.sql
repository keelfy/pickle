-- name: CreateTwitchConnection :exec
INSERT INTO twitch_connections (
        owner_id,
        broadcaster_id,
        login,
        access_token,
        refresh_token,
        expires_at
    )
VALUES (
        @owner_id::uuid,
        @broadcaster_id::text,
        @login::text,
        @access_token::text,
        @refresh_token::text,
        @expires_at::timestamptz
    ) ON CONFLICT (broadcaster_id) DO
UPDATE
SET owner_id = @owner_id::uuid,
    login = @login::text,
    access_token = @access_token::text,
    refresh_token = @refresh_token::text,
    expires_at = @expires_at::timestamptz;

-- name: GetTwitchConnectionByOwnerID :one
SELECT "login"
FROM twitch_connections
WHERE owner_id = @owner_id::uuid;