ALTER TABLE "profiles"
ADD COLUMN "suggestion_preferences" jsonb NOT NULL DEFAULT '{}';
