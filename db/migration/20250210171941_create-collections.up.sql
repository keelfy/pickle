CREATE TABLE IF NOT EXISTS "collections" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" uuid NOT NULL,
    "name" text NOT NULL,
    "user_id" uuid NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id"),
    FOREIGN KEY ("updated_by") REFERENCES "profiles"("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_collections_user_id" ON "collections"("user_id");

CREATE TABLE IF NOT EXISTS "collection_items" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "collection_id" uuid NOT NULL,
    "note_id" uuid NOT NULL,
    "category" content_category NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" uuid NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("collection_id") REFERENCES "collections"("id"),
    -- don't need it here because of any note can be of any category
    -- FOREIGN KEY ("note_id") REFERENCES "game_notes"("id"),
    FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id")
);

CREATE INDEX IF NOT EXISTS "idx_collection_items_collection_id" ON "collection_items"("collection_id");
CREATE INDEX IF NOT EXISTS "idx_collection_items_note_id" ON "collection_items"("note_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_collection_items_collection_id_note_id_category" ON "collection_items"("collection_id", "note_id", "category");
