package sql

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const upsertGame = `
INSERT INTO games (
	external_id,
	release_date,
	websites,
	cover_key,
	cover_key_type,
	source_url,
	source_type
)
VALUES (
	$1::bigint,
	$2::timestamptz,
	$3::jsonb,
	$4::text,
	$5::image_key_type,
	$6::text,
	$7::content_source
) ON CONFLICT (external_id, source_type) DO
UPDATE
SET release_date = $2::timestamptz,
	websites = $3::jsonb,
	cover_key = $4::text,
	cover_key_type = $5::image_key_type,
	source_url = $6::text,
	source_type = $7::content_source,
	updated_at = now()
RETURNING id
`

type UpsertGameParams struct {
	ExternalID   int64
	ReleaseDate  *time.Time
	Websites     *json.RawMessage
	CoverKey     *string
	CoverKeyType domain.ImageKeyType
	SourceUrl    *string
	SourceType   domain.ContentSource
}

func (q *queries) UpsertGame(ctx context.Context, arg UpsertGameParams) (uuid.UUID, error) {
	row := q.tx.QueryRow(ctx, upsertGame,
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

const upsertGameLocalization = `
INSERT INTO game_localizations (content_id, locale, title)
VALUES (
        $1::uuid,
        $2::text,
        $3::text
    ) ON CONFLICT (content_id, locale) DO
UPDATE
SET title = $3::text,
    updated_at = now()
`

type UpsertGameLocalizationParams struct {
	ContentID uuid.UUID
	Locale    string
	Title     string
}

func (q *queries) UpsertGameLocalization(ctx context.Context, arg UpsertGameLocalizationParams) error {
	_, err := q.tx.Exec(ctx, upsertGameLocalization, arg.ContentID, arg.Locale, arg.Title)
	return err
}
