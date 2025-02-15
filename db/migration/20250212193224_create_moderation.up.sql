CREATE TABLE IF NOT EXISTS "moderators" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "deleted_at" timestamptz,
    "deleted_by" uuid,
    "user_id" uuid NOT NULL,
    "moderator_id" uuid NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("moderator_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("deleted_by") REFERENCES "profiles"("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_moderators_user_id" ON "moderators"("user_id");
CREATE INDEX IF NOT EXISTS "idx_moderators_moderator_id" ON "moderators"("moderator_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_moderators_user_id_moderator_id" ON "moderators"("user_id", "moderator_id");
