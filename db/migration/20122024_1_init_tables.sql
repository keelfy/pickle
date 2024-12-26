-- Author: Egor Kuzmin (keelfy)

CREATE TABLE IF NOT EXISTS "profiles" (
    "user_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "username" text NOT NULL,
    "link" text NOT NULL,

    PRIMARY KEY (user_id)
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
    "status" smallint NOT NULL,
    "ordered_by" uuid,
    "orderer_username" text,
    "category" smallint NOT NULL,
    "message" text NOT NULL,

    PRIMARY KEY ("id"),
    FOREIGN KEY ("receiver_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("ordered_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id")
);

CREATE TABLE IF NOT EXISTS "game_notes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "game_id" uuid, -- TODO: add foreign key to games
    "name" text NOT NULL,
    "link" text,
    "release_date" timestamptz,
    "rate" smallint,
    "comment" text,
    "ordered" boolean NOT NULL,
    "status" smallint NOT NULL,
    "completion_status" smallint NOT NULL,
    "completion_date" timestamptz NOT NULL,

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
