-- name: InsertTwitchAuthorization :one
INSERT INTO twitch_authorizations (
        identity_id,
        broadcaster_id,
        access_token,
        refresh_token,
        expires_at
    )
VALUES (
        @identity_id::uuid,
        @broadcaster_id::text,
        @access_token::text,
        @refresh_token::text,
        @expires_at::timestamptz
    ) ON CONFLICT (identity_id) DO
UPDATE
SET broadcaster_id = @broadcaster_id::text,
    access_token = @access_token::text,
    refresh_token = @refresh_token::text,
    expires_at = @expires_at::timestamptz
RETURNING *;
-- name: FindTwitchAuthorizationByIdentityID :one
SELECT *
FROM twitch_authorizations
WHERE identity_id = @identity_id::uuid;
-- name: FindTwitchAuthorizationByBroadcasterID :one
SELECT *
FROM twitch_authorizations
WHERE broadcaster_id = @broadcaster_id::text;
-- name: UpdateTwitchAuthorizationByIdentityID :one
UPDATE twitch_authorizations
SET access_token = @access_token::text,
    refresh_token = @refresh_token::text,
    expires_at = @expires_at::timestamptz
WHERE identity_id = @identity_id::uuid
RETURNING *;