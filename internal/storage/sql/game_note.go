package sql

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const insertGameNote = `
INSERT INTO game_notes (
	created_by,
	updated_by,
	content_id,
	user_id,
	rate,
	comment,
	initial_orderer_id,
	status,
	last_played_at
)
VALUES (
	$1::uuid,
	$1::uuid,
	$2::uuid,
	$3::uuid,
	$4::smallint,
	$5::text,
	$6::uuid,
	$7::game_note_status,
	$8::timestamptz
)
RETURNING id, created_at, updated_at, updated_by, user_id, content_id, rate, comment, initial_orderer_id, status, last_played_at
`

type InsertGameNoteParams struct {
	CreatedBy        uuid.UUID             `json:"created_by"`
	ContentID        uuid.UUID             `json:"content_id"`
	UserID           uuid.UUID             `json:"user_id"`
	Rate             *int16                `json:"rate"`
	Comment          string                `json:"comment"`
	InitialOrdererID uuid.UUID             `json:"initial_orderer_id"`
	Status           domain.GameNoteStatus `json:"status"`
	LastPlayedAt     *time.Time            `json:"last_played_at"`
}

type InsertGameNoteRow struct {
	ID               uuid.UUID             `json:"id"`
	CreatedAt        time.Time             `json:"created_at"`
	UpdatedAt        time.Time             `json:"updated_at"`
	UpdatedBy        uuid.UUID             `json:"updated_by"`
	UserID           uuid.UUID             `json:"user_id"`
	ContentID        uuid.UUID             `json:"content_id"`
	Rate             *int16                `json:"rate"`
	Comment          string                `json:"comment"`
	InitialOrdererID uuid.UUID             `json:"initial_orderer_id"`
	Status           domain.GameNoteStatus `json:"status"`
	LastPlayedAt     *time.Time            `json:"last_played_at"`
}

func (q *queries) InsertGameNote(ctx context.Context, arg InsertGameNoteParams) (*InsertGameNoteRow, error) {
	row := q.tx.QueryRow(ctx, insertGameNote,
		arg.CreatedBy,
		arg.ContentID,
		arg.UserID,
		arg.Rate,
		arg.Comment,
		arg.InitialOrdererID,
		arg.Status,
		arg.LastPlayedAt,
	)
	i := InsertGameNoteRow{}
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
		&i.LastPlayedAt,
	)
	return &i, err
}

const updateGameNoteByID = `
UPDATE game_notes
SET updated_by = $1::uuid,
    updated_at = now(),
    rate = $2::smallint,
    comment = $3::text,
    status = $4::game_note_status,
    last_played_at = $5::timestamptz
WHERE id = $6::uuid
`

type UpdateGameNoteByIDParams struct {
	UpdatedBy    uuid.UUID             `json:"updated_by"`
	Rate         *int16                `json:"rate"`
	Comment      *string               `json:"comment"`
	Status       domain.GameNoteStatus `json:"status"`
	LastPlayedAt *time.Time            `json:"last_played_at"`
	ID           uuid.UUID             `json:"id"`
}

func (q *queries) UpdateGameNoteByID(ctx context.Context, arg UpdateGameNoteByIDParams) error {
	_, err := q.tx.Exec(ctx, updateGameNoteByID,
		arg.UpdatedBy,
		arg.Rate,
		arg.Comment,
		arg.Status,
		arg.LastPlayedAt,
		arg.ID,
	)
	return err
}

const countPlayedGameNotesByUserID = `
SELECT COUNT(*) AS count
FROM game_notes
WHERE user_id = $1::uuid
    AND status IN ('playing', 'finished', 'dropped', 'paused')
GROUP BY user_id
`

func (q *queries) CountPlayedGameNotesByUserID(ctx context.Context, userID uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, countPlayedGameNotesByUserID, userID)
	var count int64
	err := row.Scan(&count)
	return count, err
}
