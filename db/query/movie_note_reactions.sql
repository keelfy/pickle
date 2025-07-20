-- name: AddMovieNoteReaction :exec
INSERT INTO movie_note_reactions (
        movie_note_id,
        user_id,
        emote_id,
        source
    )
VALUES (
        @movie_note_id::uuid,
        @user_id::uuid,
        @emote_id::text,
        @source::reaction_source
    );
-- name: RemoveMovieNoteReaction :exec
DELETE FROM movie_note_reactions
WHERE movie_note_id = @movie_note_id::uuid
    AND user_id = @user_id::uuid
    AND emote_id = @emote_id::text
    AND source = @source::reaction_source;
-- name: GetMovieNoteReactionsByMovieNoteIDInAndUserID :many
SELECT mnr.movie_note_id,
    mnr.emote_id,
    mnr.source,
    COUNT(DISTINCT mnr.user_id) AS count,
    COALESCE(
        (
            SELECT 1
            FROM movie_note_reactions r2
            WHERE r2.movie_note_id = mnr.movie_note_id
                AND r2.user_id = sqlc.narg('user_id')::uuid
                AND r2.emote_id = mnr.emote_id
                AND r2.source = mnr.source
        ),
        0
    ) AS reacted_by_user
FROM movie_note_reactions mnr
WHERE mnr.movie_note_id = ANY(@movie_note_ids::uuid [])
GROUP BY mnr.movie_note_id,
    mnr.emote_id,
    mnr.source
ORDER BY count DESC;
-- name: CountMovieNoteReactionsByMovieNoteIDAndUserID :one
SELECT COUNT(*)
FROM movie_note_reactions
WHERE movie_note_id = @movie_note_id::uuid
    AND user_id = @user_id::uuid;