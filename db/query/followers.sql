-- name: InsertFollower :exec
INSERT INTO followers (user_id, follower_id)
VALUES (
        @user_id::uuid,
        @follower_id::uuid
    );
-- name: CountFollowers :one
SELECT COUNT(*)
FROM followers
WHERE user_id = @user_id::uuid;
-- name: DeleteFollower :exec
DELETE FROM followers
WHERE user_id = @user_id::uuid
    AND follower_id = @follower_id::uuid;
-- name: IsFollowing :one
SELECT COUNT(*)
FROM followers
WHERE user_id = @user_id::uuid
    AND follower_id = @follower_id::uuid;