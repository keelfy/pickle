-- name: AddGameNoteReaction :exec
INSERT INTO "game_note_reactions" (
    "game_note_id",
    "user_id",
    "emote_id",
    "source",
    "created_by"
) VALUES (
    $1, $2, $3, $4, $5
);

-- name: RemoveGameNoteReaction :exec
DELETE FROM "game_note_reactions"
WHERE "game_note_id" = $1 
    AND "user_id" = $2 
    AND "emote_id" = $3
    AND "source" = $4;

-- name: GetGameNoteReactionsByGameNoteIdAndUserId :many
SELECT 
    gnr."emote_id",
    gnr."source",
    COUNT(*) as "count",
    EXISTS (
        SELECT 1 
        FROM "game_note_reactions" r2 
        WHERE r2."game_note_id" = gnr."game_note_id" 
            AND r2."user_id" = $2 
            AND r2."emote_id" = gnr."emote_id"
            AND r2."source" = gnr."source"
    ) as "reacted_by_user"
FROM "game_note_reactions" gnr
WHERE gnr."game_note_id" = $1
GROUP BY gnr."game_note_id", gnr."emote_id", gnr."source";

-- name: GetGameNoteReactionsByGameNoteId :many
SELECT 
    gnr."emote_id",
    gnr."source",
    COUNT(*) as "count"
FROM "game_note_reactions" gnr
WHERE gnr."game_note_id" = $1
GROUP BY gnr."game_note_id", gnr."emote_id", gnr."source";
