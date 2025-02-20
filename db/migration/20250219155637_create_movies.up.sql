CREATE TYPE "movie_note_status" AS ENUM (
    'planned',
    'dropped',
    'watched',
    'skipped'
);

CREATE TABLE IF NOT EXISTS "movie_notes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "name" text NOT NULL,
    "release_date" timestamptz,
    "rate" smallint,
    "comment" text,
    "status" movie_note_status NOT NULL DEFAULT('planned'),
    "initial_orderer_id" uuid NOT NULL,
    "watched_at" timestamptz,
    "poster_key" text,
    "poster_updated_at" timestamptz NOT NULL DEFAULT now(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("initial_orderer_id") REFERENCES "orderers"("id")
);

CREATE INDEX IF NOT EXISTS "idx_movie_notes_user_id" ON "movie_notes"("user_id");

CREATE TABLE IF NOT EXISTS "movie_note_orders" (
    "movie_note_id" uuid NOT NULL,
    "order_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    PRIMARY KEY ("movie_note_id", "order_id"),
    FOREIGN KEY ("movie_note_id") REFERENCES "movie_notes"("id"),
    FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_movie_note_orders_movie_note_id" ON "movie_note_orders"("movie_note_id");

CREATE TABLE IF NOT EXISTS "movie_note_reactions" (
    "movie_note_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "emote_id" text NOT NULL,
    "source" reaction_source NOT NULL,
    PRIMARY KEY ("movie_note_id", "user_id", "emote_id", "source"),
    FOREIGN KEY ("movie_note_id") REFERENCES "movie_notes"("id"),
    FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_movie_note_reactions_movie_note_id" ON "movie_note_reactions"("movie_note_id");
