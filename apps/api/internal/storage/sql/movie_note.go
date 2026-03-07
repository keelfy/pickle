package sql

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const insertMovieNote = `
INSERT INTO movie_notes (
	created_by,
	updated_by,
	content_id,
	user_id,
	rate,
	comment,
	initial_orderer_id,
	status,
	watched_at
)
VALUES (
	$1::uuid,
	$1::uuid,
	$2::uuid,
	$3::uuid,
	$4::smallint,
	$5::text,
	$6::uuid,
	$7::movie_note_status,
	$8::timestamptz
)
RETURNING id, created_at, updated_at, updated_by, user_id, content_id, rate, comment, initial_orderer_id, status, watched_at
`

type InsertMovieNoteParams struct {
	CreatedBy        uuid.UUID              `json:"created_by"`
	ContentID        uuid.UUID              `json:"content_id"`
	UserID           uuid.UUID              `json:"user_id"`
	Rate             *int16                 `json:"rate"`
	Comment          string                 `json:"comment"`
	InitialOrdererID uuid.UUID              `json:"initial_orderer_id"`
	Status           domain.MovieNoteStatus `json:"status"`
	WatchedAt        *time.Time             `json:"watched_at"`
}

type InsertMovieNoteRow struct {
	ID               uuid.UUID              `json:"id"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
	UpdatedBy        uuid.UUID              `json:"updated_by"`
	UserID           uuid.UUID              `json:"user_id"`
	ContentID        uuid.UUID              `json:"content_id"`
	Rate             *int16                 `json:"rate"`
	Comment          string                 `json:"comment"`
	InitialOrdererID uuid.UUID              `json:"initial_orderer_id"`
	Status           domain.MovieNoteStatus `json:"status"`
	WatchedAt        *time.Time             `json:"watched_at"`
}

func (q *queries) InsertMovieNote(ctx context.Context, arg InsertMovieNoteParams) (*InsertMovieNoteRow, error) {
	row := q.tx.QueryRow(ctx, insertMovieNote,
		arg.CreatedBy,
		arg.ContentID,
		arg.UserID,
		arg.Rate,
		arg.Comment,
		arg.InitialOrdererID,
		arg.Status,
		arg.WatchedAt,
	)
	i := InsertMovieNoteRow{}
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.UserID,
		&i.ContentID,
		&i.Rate,
		&i.Comment,
		&i.InitialOrdererID,
		&i.Status,
		&i.WatchedAt,
	)
	return &i, err
}

const updateMovieNoteByID = `
UPDATE movie_notes
SET updated_by = $1::uuid,
    updated_at = now(),
    content_id = $2::uuid,
    rate = $3::smallint,
    comment = $4::text,
    status = $5::movie_note_status,
    watched_at = $6::timestamptz
WHERE id = $7::uuid
`

type UpdateMovieNoteByIDParams struct {
	UpdatedBy uuid.UUID              `json:"updated_by"`
	ContentID uuid.UUID              `json:"content_id"`
	Rate      *int16                 `json:"rate"`
	Comment   *string                `json:"comment"`
	Status    domain.MovieNoteStatus `json:"status"`
	WatchedAt *time.Time             `json:"watched_at"`
	ID        uuid.UUID              `json:"id"`
}

func (q *queries) UpdateMovieNoteByID(ctx context.Context, arg UpdateMovieNoteByIDParams) error {
	_, err := q.tx.Exec(ctx, updateMovieNoteByID,
		arg.UpdatedBy,
		arg.ContentID,
		arg.Rate,
		arg.Comment,
		arg.Status,
		arg.WatchedAt,
		arg.ID,
	)
	return err
}

const countWatchedMovieNotesByUserID = `
SELECT COUNT(*) AS count
FROM movie_notes
WHERE user_id = $1::uuid
    AND status = 'watched'
`

func (q *queries) CountWatchedMovieNotesByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, countWatchedMovieNotesByUserID, userID)
	var count int64
	err := row.Scan(&count)
	return count, err
}
