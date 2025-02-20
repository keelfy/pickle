DROP INDEX IF EXISTS "idx_movie_note_orders_movie_note_id";
DROP INDEX IF EXISTS "idx_movie_note_reactions_movie_note_id";
DROP INDEX IF EXISTS "idx_movie_notes_user_id";

DROP TABLE IF EXISTS "movie_note_reactions";
DROP TABLE IF EXISTS "movie_note_orders";
DROP TABLE IF EXISTS "movie_notes";

DROP TYPE IF EXISTS "movie_note_status";
