package sql

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const upsertMovie = `
INSERT INTO movies (
	external_id,
	release_date,
	websites,
	cover_key,
	cover_key_type,
	source_url,
	source_type
) VALUES (
	$1,
	$2::timestamptz,
	$3::jsonb,
	$4::text,
	$5::image_key_type,
	$6::text,
	$7
)
ON CONFLICT (external_id, source_type) DO UPDATE SET
	release_date = EXCLUDED.release_date,
	websites = EXCLUDED.websites,
	cover_key = EXCLUDED.cover_key,
	cover_key_type = EXCLUDED.cover_key_type,
	source_url = EXCLUDED.source_url,
	updated_at = now()
RETURNING id
`

type UpsertMovieParams struct {
	ExternalID   int64
	ReleaseDate  *time.Time
	Websites     *json.RawMessage
	CoverKey     *string
	CoverKeyType domain.ImageKeyType
	SourceUrl    *string
	SourceType   domain.ContentSource
}

func (q *queries) UpsertMovie(ctx context.Context, arg UpsertMovieParams) (uuid.UUID, error) {
	row := q.tx.QueryRow(ctx, upsertMovie,
		arg.ExternalID,
		arg.ReleaseDate,
		arg.Websites,
		arg.CoverKey,
		arg.CoverKeyType,
		arg.SourceUrl,
		arg.SourceType,
	)
	var id uuid.UUID
	err := row.Scan(&id)
	return id, err
}

const upsertMovieLocalization = `
INSERT INTO movie_localizations (
	content_id,
	locale,
	title
) VALUES (
	$1::uuid,
	$2::text,
	$3::text
)
ON CONFLICT (content_id, locale) DO UPDATE SET
	title = EXCLUDED.title,
	updated_at = now()
`

type UpsertMovieLocalizationParams struct {
	ContentID uuid.UUID
	Locale    string
	Title     string
}

func (q *queries) UpsertMovieLocalization(ctx context.Context, arg UpsertMovieLocalizationParams) error {
	_, err := q.tx.Exec(ctx, upsertMovieLocalization, arg.ContentID, arg.Locale, arg.Title)
	return err
}
