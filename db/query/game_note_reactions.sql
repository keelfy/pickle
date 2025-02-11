-- name: AddGameNoteReaction :exec
INSERT INTO "game_note_reactions" (
    "game_note_id",
    "user_id",
    "emote_id",
    "source",
    "created_by"
) VALUES (
    @game_note_id::uuid,
    @user_id::uuid,
    @emote_id::text,
    @source::reaction_source,
    @created_by::uuid
);

-- name: RemoveGameNoteReaction :exec
DELETE FROM "game_note_reactions"
WHERE "game_note_id" = @game_note_id::uuid
    AND "user_id" = @user_id::uuid
    AND "emote_id" = @emote_id::text
    AND "source" = @source::reaction_source;

-- name: GetGameNoteReactionsByGameNoteIdInAndUserId :many
SELECT 
    gnr."game_note_id",
    gnr."emote_id",
    gnr."source",
    COUNT(DISTINCT gnr."user_id") AS "count",
    COALESCE(
        (
            SELECT 1 
            FROM "game_note_reactions" r2 
            WHERE r2."game_note_id" = gnr."game_note_id" 
                AND r2."user_id" = @user_id::uuid
                AND r2."emote_id" = gnr."emote_id"
                AND r2."source" = gnr."source"
        ), 0) AS "reacted_by_user"
FROM "game_note_reactions" gnr
WHERE gnr."game_note_id" = ANY(@game_note_ids::uuid[])
GROUP BY gnr."game_note_id", gnr."emote_id", gnr."source"
ORDER BY "count" DESC;

-- name: CountGameNoteReactionsByGameNoteIdAndUserId :one
SELECT COUNT(*) FROM "game_note_reactions"
WHERE "game_note_id" = @game_note_id::uuid
    AND "user_id" = @user_id::uuid;

