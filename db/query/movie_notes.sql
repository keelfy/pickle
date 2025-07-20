-- name: InsertMovieNote :one
INSERT INTO movie_notes (
        user_id,
        content_id,
        rate,
        comment,
        status,
        initial_orderer_id,
        watched_at,
        created_by,
        updated_by
    )
VALUES (
        @user_id::uuid,
        @content_id::uuid,
        sqlc.narg('rate')::smallint,
        sqlc.narg('comment')::text,
        @status::movie_note_status,
        @initial_orderer_id::uuid,
        sqlc.narg('watched_at')::timestamptz,
        @created_by::uuid,
        @created_by::uuid
    )
RETURNING *;
-- name: FindMovieNoteByID :one
SELECT *
FROM movie_notes
WHERE id = @id::uuid;
-- name: FindPaginatedMovieNotesByUserID :many
SELECT mn.id,
    mn.created_at,
    mn.content_id,
    mn.status,
    mn.rate,
    mn.comment,
    mn.watched_at,
    o.display_name AS initial_orderer_display_name,
    COALESCE(order_counts.count, 0) AS orderer_count
FROM movie_notes mn
    LEFT JOIN orderers o ON mn.initial_orderer_id = o.id
    LEFT JOIN (
        SELECT movie_note_id,
            COUNT(*) AS count
        FROM movie_note_orders
        GROUP BY movie_note_id
    ) AS order_counts ON mn.id = order_counts.movie_note_id
WHERE mn.user_id = @user_id::uuid
ORDER BY mn.created_at DESC
LIMIT sqlc.arg('limit')::int;
-- name: CountWatchedMovieNotesByUserID :one
SELECT COUNT(*) AS count
FROM movie_notes
WHERE user_id = @user_id::uuid
    AND status = 'watched';
-- name: DeleteMovieNoteByID :exec
DELETE FROM movie_notes
WHERE id = @id::uuid;
-- name: UpdateMovieNoteByID :exec
UPDATE movie_notes
SET updated_by = @updated_by::uuid,
    updated_at = now(),
    content_id = @content_id::uuid,
    rate = sqlc.narg('rate')::smallint,
    comment = sqlc.narg('comment')::text,
    status = @status::movie_note_status,
    watched_at = sqlc.narg('watched_at')::timestamptz
WHERE id = @id::uuid;
-- name: UpdateMovieNoteContentID :one
UPDATE movie_notes
SET content_id = @content_id::uuid,
    updated_by = @updated_by::uuid,
    updated_at = now()
WHERE id = @id::uuid
RETURNING *;
-- name: FindMovieNoteByContentID :one
SELECT *
FROM movie_notes
WHERE content_id = @content_id::uuid
    AND user_id = @user_id::uuid;
-- name: FindLocalizedMovieNoteByID :one
SELECT mn.*,
    COALESCE(ml.title, 'Untitled Movie') AS title
FROM movie_notes mn
    LEFT JOIN movie_localizations ml ON mn.content_id = ml.content_id
    AND ml.lang = @locale::locale
WHERE mn.id = @id::uuid;
-- name: FindDetailedMovieNoteByID :one
SELECT mn.*,
    COALESCE(ml.title, 'Untitled Movie') AS title,
    m.cover_key,
    m.cover_key_type,
    m.source_url,
    m.source_type,
    m.release_date
FROM movie_notes mn
    LEFT JOIN movies m ON mn.content_id = m.id
    LEFT JOIN movie_localizations ml ON m.id = ml.content_id
    AND ml.lang = @locale::locale
WHERE mn.id = @id::uuid;