-- name: InsertTrackedReward :exec
INSERT INTO broadcaster_tracked_rewards (
        broadcaster_id,
        tracked_reward_id,
        category,
        updated_by
    )
VALUES (
        @broadcaster_id::text,
        @tracked_reward_id::text,
        @category::text,
        @updated_by::uuid
    ) ON CONFLICT (broadcaster_id, tracked_reward_id) DO
UPDATE
SET category = @category::text,
    updated_by = @updated_by::uuid;
-- name: FindTrackedRewardsByBroadcasterID :many
SELECT *
FROM broadcaster_tracked_rewards
WHERE broadcaster_id = @broadcaster_id::text;
-- name: DeleteTrackedRewardsByBroadcasterID :exec
DELETE FROM broadcaster_tracked_rewards
WHERE broadcaster_id = @broadcaster_id::text
    AND tracked_reward_id = ANY(@tracked_reward_ids::text[]);