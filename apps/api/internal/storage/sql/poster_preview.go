package sql

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const deletePosterPreview = `
DELETE FROM poster_previews
WHERE id = $1::uuid
`

func (q *queries) DeletePosterPreview(ctx context.Context, id uuid.UUID) error {
	_, err := q.tx.Exec(ctx, deletePosterPreview, id)
	return err
}

const findPosterPreviewByCreatedAtAfterAndCreatedBy = `
SELECT id, created_at, created_by, object_key
FROM poster_previews
WHERE created_at > $1::timestamptz
	AND created_by = $2::uuid
ORDER BY created_at DESC
LIMIT $3::int
`

type FindPosterPreviewByCreatedAtAfterAndCreatedByParams struct {
	CreatedAt time.Time
	CreatedBy uuid.UUID
	Limit     int32
}

func (q *queries) FindPosterPreviewByCreatedAtAfterAndCreatedBy(ctx context.Context, arg FindPosterPreviewByCreatedAtAfterAndCreatedByParams) ([]*domain.PosterPreview, error) {
	rows, err := q.tx.Query(ctx, findPosterPreviewByCreatedAtAfterAndCreatedBy, arg.CreatedAt, arg.CreatedBy, arg.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.PosterPreview{}
	for rows.Next() {
		var i domain.PosterPreview
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.CreatedBy,
			&i.ObjectKey,
		); err != nil {
			return nil, err
		}
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findPosterPreviewByCreatedBy = `
SELECT id, created_at, created_by, object_key
FROM poster_previews
WHERE created_by = $1::uuid
ORDER BY created_at DESC
`

func (q *queries) FindPosterPreviewByCreatedBy(ctx context.Context, createdBy uuid.UUID) ([]*domain.PosterPreview, error) {
	rows, err := q.tx.Query(ctx, findPosterPreviewByCreatedBy, createdBy)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.PosterPreview{}
	for rows.Next() {
		var i domain.PosterPreview
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.CreatedBy,
			&i.ObjectKey,
		); err != nil {
			return nil, err
		}
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findPosterPreviewByID = `
SELECT id, created_at, created_by, object_key
FROM poster_previews
WHERE id = $1::uuid
`

func (q *queries) FindPosterPreviewByID(ctx context.Context, id uuid.UUID) (*domain.PosterPreview, error) {
	row := q.tx.QueryRow(ctx, findPosterPreviewByID, id)
	var i domain.PosterPreview
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.ObjectKey,
	)
	return &i, err
}

const insertPosterPreview = `
INSERT INTO poster_previews (id, created_by, object_key)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::text
)
RETURNING id, created_at, created_by, object_key
`

type InsertPosterPreviewParams struct {
	ID        uuid.UUID
	CreatedBy uuid.UUID
	ObjectKey string
}

func (q *queries) InsertPosterPreview(ctx context.Context, arg InsertPosterPreviewParams) (*domain.PosterPreview, error) {
	row := q.tx.QueryRow(ctx, insertPosterPreview, arg.ID, arg.CreatedBy, arg.ObjectKey)
	var i domain.PosterPreview
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.ObjectKey,
	)
	return &i, err
}
