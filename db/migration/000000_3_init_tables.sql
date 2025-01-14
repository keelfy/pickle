-- Author: Egor Kuzmin (keelfy)
CREATE TABLE IF NOT EXISTS "migration_logs" (
    "id" SERIAL,
    -- SERIAL is an auto-incrementing integer
    "name" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);
-- Author: Egor Kuzmin (keelfy)
CREATE TABLE IF NOT EXISTS "es_migration_logs" (
    "id" SERIAL,
    -- SERIAL is an auto-incrementing integer
    "name" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);
-- Author: Egor Kuzmin (keelfy)
CREATE TABLE IF NOT EXISTS "profiles" (
    "user_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    -- nullable because webhook creates profile
    "updated_by" uuid,
    "username" text NOT NULL,
    "link" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "avatar_url" text,
    "avatar_preview_key" text,
    PRIMARY KEY ("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id")
);
CREATE TABLE IF NOT EXISTS "orderers" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid,
    "user_id" uuid,
    "username" text NOT NULL,
    "anonymous" boolean NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id")
);
CREATE TABLE IF NOT EXISTS "orders" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid NOT NULL,
    "receiver_id" uuid NOT NULL,
    "payment_type" smallint NOT NULL,
    "amount" real NOT NULL,
    "status" order_status NOT NULL,
    "orderer_id" uuid NOT NULL,
    "orderer_username" text NOT NULL,
    "message" text NOT NULL,
    "category" content_category NOT NULL,
    "updated_message" text,
    "updated_category" content_category,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("receiver_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("orderer_id") REFERENCES "orderers"("id")
);
CREATE TABLE IF NOT EXISTS "game_notes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "game_id" uuid,
    -- TODO: add foreign key to games
    "name" text NOT NULL,
    "link" text,
    "release_date" timestamptz,
    "rate" smallint,
    "comment" text,
    "ordered" boolean NOT NULL,
    "status" game_note_status NOT NULL DEFAULT('planned'),
    "last_played_at" timestamptz,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id")
);
CREATE TABLE IF NOT EXISTS "game_note_orders" (
    "game_note_id" uuid NOT NULL,
    "order_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid NOT NULL,
    PRIMARY KEY (game_note_id, order_id),
    FOREIGN KEY (created_by) REFERENCES profiles(user_id),
    FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
);