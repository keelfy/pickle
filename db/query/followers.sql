-- Author: Egor Kuzmin (keelfy)
-- name: InsertFollower :exec
INSERT INTO "followers" ("user_id", "follower_id") VALUES ($1, $2);

-- Author: Egor Kuzmin (keelfy)
-- name: CountFollowers :one
SELECT COUNT(*) 
FROM "followers" 
WHERE "user_id" = $1;

-- Author: Egor Kuzmin (keelfy)
-- name: DeleteFollower :exec
DELETE FROM "followers" WHERE "user_id" = $1 AND "follower_id" = $2;

-- Author: Egor Kuzmin (keelfy)
-- name: IsFollowing :one
SELECT COUNT(*) 
FROM "followers" 
WHERE "user_id" = $1 
    AND "follower_id" = $2;

