-- name: InsertGameNote :one
INSERT INTO game_notes (
        created_by,
        updated_by,
        content_id,
        user_id,
        rate,
        comment,
        initial_orderer_id,
        status,
        last_played_at
    )
VALUES (
        @created_by::uuid,
        @created_by::uuid,
        @content_id::uuid,
        @user_id::uuid,
        sqlc.narg('rate')::smallint,
        sqlc.narg('comment')::text,
        @initial_orderer_id::uuid,
        @status::game_note_status,
        sqlc.narg('last_played_at')::timestamptz
    )
RETURNING *;
-- name: FindGameNoteByID :one
SELECT *
FROM game_notes
WHERE id = @id::uuid;
-- name: FindPaginatedGameNotesByUserID :many
SELECT gn.id,
    gn.created_at,
    gn.content_id,
    gn.status,
    gn.rate,
    gn.comment,
    gn.last_played_at,
    o.display_name AS initial_orderer_display_name,
    COALESCE(order_counts.count, 0) AS orderer_count
FROM game_notes gn
    INNER JOIN orderers o ON gn.initial_orderer_id = o.id
    LEFT JOIN (
        SELECT game_note_id,
            COUNT(*) as count
        FROM game_note_orders
        GROUP BY game_note_id
    ) order_counts ON gn.id = order_counts.game_note_id
WHERE gn.user_id = @user_id::uuid
    AND gn.updated_at < @updated_at::timestamptz
ORDER BY gn.updated_at DESC
LIMIT sqlc.arg('limit')::int;
-- name: CountPlayedGameNotesByUserID :one
SELECT COUNT(*) AS count
FROM game_notes
WHERE user_id = @user_id::uuid
    AND status IN ('playing', 'finished', 'dropped', 'paused')
GROUP BY user_id;
-- name: DeleteGameNoteByID :exec
DELETE FROM game_notes
WHERE id = @id::uuid;
-- name: UpdateGameNoteByID :exec
UPDATE game_notes
SET updated_by = @updated_by::uuid,
    updated_at = now(),
    rate = sqlc.narg('rate')::smallint,
    comment = sqlc.narg('comment')::text,
    status = @status::game_note_status,
    last_played_at = sqlc.narg('last_played_at')::timestamptz
WHERE id = @id::uuid;
-- name: FindGameNoteByContentID :one
SELECT *
FROM game_notes
WHERE content_id = @content_id::uuid
    AND user_id = @user_id::uuid;
-- name: FindLocalizedGameNoteByID :one
SELECT gn.*,
    COALESCE(gl.title, 'Untitled Game') AS title
FROM game_notes gn
    LEFT JOIN game_localizations gl ON gn.content_id = gl.content_id
    AND gl.lang = @locale::text
WHERE gn.id = @id::uuid;
-- name: FindDetailedGameNoteByID :one
SELECT gn.*,
    COALESCE(gl.title, 'Untitled Game') AS title,
    g.cover_key,
    g.cover_key_type,
    g.source_url,
    g.source_type,
    g.websites,
    g.release_date
FROM game_notes gn
    LEFT JOIN games g ON gn.content_id = g.id
    LEFT JOIN game_localizations gl ON g.id = gl.content_id
    AND gl.lang = @locale::text
WHERE gn.id = @id::uuid;
-- name: FindGameNoteContentIDsByUserID :many
SELECT DISTINCT content_id
FROM game_notes
WHERE user_id = @user_id::uuid;