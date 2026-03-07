package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const countCollectionItemsByCollectionID = `
SELECT COUNT(*)
FROM collection_items ci
	INNER JOIN collections c ON ci.collection_id = c.id
WHERE c.id = $1::uuid
`

func (q *queries) CountCollectionItemsByCollectionID(ctx context.Context, id uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, countCollectionItemsByCollectionID, id)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const deleteCollectionByID = `
DELETE FROM collections
WHERE id = $1::uuid
`

func (q *queries) DeleteCollectionByID(ctx context.Context, id uuid.UUID) error {
	_, err := q.tx.Exec(ctx, deleteCollectionByID, id)
	return err
}

const deleteCollectionItemByID = `
DELETE FROM collection_items
WHERE id = $1::uuid
`

func (q *queries) DeleteCollectionItemByID(ctx context.Context, id uuid.UUID) error {
	_, err := q.tx.Exec(ctx, deleteCollectionItemByID, id)
	return err
}

const deleteCollectionItemsByCollectionID = `
DELETE FROM collection_items
WHERE collection_id = $1::uuid
`

func (q *queries) DeleteCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) error {
	_, err := q.tx.Exec(ctx, deleteCollectionItemsByCollectionID, collectionID)
	return err
}

const findCollectionByID = `
SELECT id, created_at, created_by, updated_at, updated_by, name, user_id
FROM collections
WHERE id = $1::uuid
`

func (q *queries) FindCollectionByID(ctx context.Context, id uuid.UUID) (*domain.Collection, error) {
	row := q.tx.QueryRow(ctx, findCollectionByID, id)
	var collection domain.Collection
	err := row.Scan(
		&collection.ID,
		&collection.CreatedAt,
		&collection.CreatedBy,
		&collection.UpdatedAt,
		&collection.UpdatedBy,
		&collection.Name,
		&collection.UserID,
	)
	return &collection, err
}

const findCollectionItemByID = `
SELECT id, collection_id, note_id, content_id, category, created_at, created_by
FROM collection_items
WHERE id = $1::uuid
`

func (q *queries) FindCollectionItemByID(ctx context.Context, id uuid.UUID) (*domain.CollectionItem, error) {
	row := q.tx.QueryRow(ctx, findCollectionItemByID, id)
	var collectionItem domain.CollectionItem
	err := row.Scan(
		&collectionItem.ID,
		&collectionItem.CollectionID,
		&collectionItem.NoteID,
		&collectionItem.ContentID,
		&collectionItem.Category,
		&collectionItem.CreatedAt,
		&collectionItem.CreatedBy,
	)
	return &collectionItem, err
}

const findCollectionItemsByCollectionID = `
SELECT id, collection_id, note_id, content_id, category, created_at, created_by
FROM collection_items
WHERE collection_id = $1::uuid
`

func (q *queries) FindCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) ([]*domain.CollectionItem, error) {
	rows, err := q.tx.Query(ctx, findCollectionItemsByCollectionID, collectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.CollectionItem{}
	for rows.Next() {
		var collectionItem domain.CollectionItem
		if err := rows.Scan(
			&collectionItem.ID,
			&collectionItem.CollectionID,
			&collectionItem.NoteID,
			&collectionItem.ContentID,
			&collectionItem.Category,
			&collectionItem.CreatedAt,
			&collectionItem.CreatedBy,
		); err != nil {
			return nil, err
		}
		items = append(items, &collectionItem)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findCollectionItemsByCollectionIDWithContent = `
SELECT 
	ci.id,
	ci.collection_id, 
	ci.note_id, 
	ci.content_id, 
	ci.category, 
	ci.created_at, 
	ci.created_by,
	-- content
	CASE
		WHEN ci.category = 'games' THEN gl.title
		WHEN ci.category = 'movies' THEN ml.title
		ELSE NULL
	END AS content_title,
	CASE
		WHEN ci.category = 'games' THEN g.cover_key
		WHEN ci.category = 'movies' THEN m.cover_key
		ELSE NULL
	END AS cover_key,
	CASE
		WHEN ci.category = 'games' THEN g.cover_key_type
		WHEN ci.category = 'movies' THEN m.cover_key_type
		ELSE NULL
	END AS cover_key_type
FROM collection_items ci
	INNER JOIN collections c ON ci.collection_id = c.id
	LEFT JOIN games g ON ci.category = 'games'
	AND ci.content_id = g.id
	LEFT JOIN game_localizations gl ON g.id = gl.content_id
	AND gl.locale = $1::text
	LEFT JOIN movies m ON ci.category = 'movies'
	AND ci.content_id = m.id
	LEFT JOIN movie_localizations ml ON m.id = ml.content_id
	AND ml.locale = $1::text
WHERE c.id = $2::uuid
ORDER BY ci.created_at DESC
LIMIT $4::int OFFSET $3::int
`

func (q *queries) FindCollectionItemsByCollectionIDWithContent(ctx context.Context, collectionID uuid.UUID, locale string, pagination *domain.Pagination) ([]*domain.CollectionItem, error) {
	rows, err := q.tx.Query(ctx, findCollectionItemsByCollectionIDWithContent,
		locale,
		collectionID,
		pagination.From,
		pagination.Size,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.CollectionItem{}
	for rows.Next() {
		var collectionItem domain.CollectionItem
		var content domain.ContentBase
		if err := rows.Scan(
			&collectionItem.ID,
			&collectionItem.CollectionID,
			&collectionItem.NoteID,
			&collectionItem.ContentID,
			&collectionItem.Category,
			&collectionItem.CreatedAt,
			&collectionItem.CreatedBy,
			&content.Title,
			&content.CoverKey,
			&content.CoverKeyType,
		); err != nil {
			return nil, err
		}
		content.ID = collectionItem.ContentID
		collectionItem.Content = &content
		items = append(items, &collectionItem)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findCollectionItemsByUserID = `
SELECT ci.id, ci.collection_id, ci.note_id, ci.content_id, ci.category, ci.created_at, ci.created_by
FROM collection_items ci
    INNER JOIN collections c ON ci.collection_id = c.id
WHERE c.user_id = $1::uuid
`

func (q *queries) FindCollectionItemsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.CollectionItem, error) {
	rows, err := q.tx.Query(ctx, findCollectionItemsByUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.CollectionItem{}
	for rows.Next() {
		var collectionItem domain.CollectionItem
		if err := rows.Scan(
			&collectionItem.ID,
			&collectionItem.CollectionID,
			&collectionItem.NoteID,
			&collectionItem.ContentID,
			&collectionItem.Category,
			&collectionItem.CreatedAt,
			&collectionItem.CreatedBy,
		); err != nil {
			return nil, err
		}
		items = append(items, &collectionItem)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findCollectionItemsByUserIDWithContentLimitPerCollection = `
WITH ranked_items AS (
	SELECT 
		ci.id, 
		ci.collection_id, 
		ci.note_id, 
		ci.content_id,
		ci.category,
		ci.created_at,
		ci.created_by,
		-- content
		CASE
			WHEN ci.category = 'games' THEN gl.title
			WHEN ci.category = 'movies' THEN ml.title
			ELSE NULL
		END AS content_title,
		CASE
			WHEN ci.category = 'games' THEN g.cover_key
			WHEN ci.category = 'movies' THEN m.cover_key
			ELSE NULL
		END AS cover_key,
		CASE
			WHEN ci.category = 'games' THEN g.cover_key_type
			WHEN ci.category = 'movies' THEN m.cover_key_type
			ELSE NULL
		END AS cover_key_type,
		ROW_NUMBER() OVER (
			PARTITION BY ci.collection_id
			ORDER BY ci.created_at DESC
		) AS rn
	FROM collection_items ci
		INNER JOIN collections c ON ci.collection_id = c.id
		LEFT JOIN games g ON ci.category = 'games'
		AND ci.content_id = g.id
		LEFT JOIN game_localizations gl ON g.id = gl.content_id
		AND gl.locale = $2::text
		LEFT JOIN movies m ON ci.category = 'movies'
		AND ci.content_id = m.id
		LEFT JOIN movie_localizations ml ON m.id = ml.content_id
		AND ml.locale = $2::text
	WHERE c.user_id = $3::uuid
)
SELECT ri.id, ri.collection_id, ri.note_id, ri.content_id, ri.category, ri.created_at, ri.created_by, ri.content_title, ri.cover_key, ri.cover_key_type
FROM ranked_items ri
WHERE ri.rn <= $1::smallint
ORDER BY ri.created_at DESC
`

func (q *queries) FindCollectionItemsByUserIDWithContentLimitPerCollection(ctx context.Context, userID uuid.UUID, limit int16, locale string) ([]*domain.CollectionItem, error) {
	rows, err := q.tx.Query(ctx, findCollectionItemsByUserIDWithContentLimitPerCollection, limit, locale, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.CollectionItem{}
	for rows.Next() {
		var collectionItem domain.CollectionItem
		var content domain.ContentBase
		if err := rows.Scan(
			&collectionItem.ID,
			&collectionItem.CollectionID,
			&collectionItem.NoteID,
			&collectionItem.ContentID,
			&collectionItem.Category,
			&collectionItem.CreatedAt,
			&collectionItem.CreatedBy,
			&content.Title,
			&content.CoverKey,
			&content.CoverKeyType,
		); err != nil {
			return nil, err
		}
		content.ID = collectionItem.ContentID
		collectionItem.Content = &content
		items = append(items, &collectionItem)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const findCollectionsByUserID = `
SELECT id, created_at, created_by, updated_at, updated_by, name, user_id
FROM collections
WHERE user_id = $1::uuid
`

func (q *queries) FindCollectionsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Collection, error) {
	rows, err := q.tx.Query(ctx, findCollectionsByUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.Collection{}
	for rows.Next() {
		var collection domain.Collection
		if err := rows.Scan(
			&collection.ID,
			&collection.CreatedAt,
			&collection.CreatedBy,
			&collection.UpdatedAt,
			&collection.UpdatedBy,
			&collection.Name,
			&collection.UserID,
		); err != nil {
			return nil, err
		}
		items = append(items, &collection)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const insertCollection = `
INSERT INTO collections (
	created_by,
	updated_by,
	name,
	user_id
)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::text,
	$4::uuid
)
RETURNING id, created_at, created_by, updated_at, updated_by, name, user_id
`

type InsertCollectionParams struct {
	CreatedBy uuid.UUID
	UpdatedBy uuid.UUID
	Name      string
	UserID    uuid.UUID
}

func (q *queries) InsertCollection(ctx context.Context, arg InsertCollectionParams) (*domain.Collection, error) {
	row := q.tx.QueryRow(ctx, insertCollection,
		arg.CreatedBy,
		arg.UpdatedBy,
		arg.Name,
		arg.UserID,
	)
	var collection domain.Collection
	err := row.Scan(
		&collection.ID,
		&collection.CreatedAt,
		&collection.CreatedBy,
		&collection.UpdatedAt,
		&collection.UpdatedBy,
		&collection.Name,
		&collection.UserID,
	)
	return &collection, err
}

const insertCollectionItem = `
INSERT INTO collection_items (
	collection_id,
	note_id,
	content_id,
	category,
	created_by
)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::uuid,
	$4::content_category,
	$5::uuid
)
RETURNING id, collection_id, note_id, content_id, category, created_at, created_by
`

type InsertCollectionItemParams struct {
	CollectionID uuid.UUID
	NoteID       uuid.UUID
	ContentID    uuid.UUID
	Category     domain.ContentCategory
	CreatedBy    uuid.UUID
}

func (q *queries) InsertCollectionItem(ctx context.Context, arg InsertCollectionItemParams) (*domain.CollectionItem, error) {
	row := q.tx.QueryRow(ctx, insertCollectionItem,
		arg.CollectionID,
		arg.NoteID,
		arg.ContentID,
		arg.Category,
		arg.CreatedBy,
	)
	var collectionItem domain.CollectionItem
	err := row.Scan(
		&collectionItem.ID,
		&collectionItem.CollectionID,
		&collectionItem.NoteID,
		&collectionItem.ContentID,
		&collectionItem.Category,
		&collectionItem.CreatedAt,
		&collectionItem.CreatedBy,
	)
	return &collectionItem, err
}

const updateCollectionByID = `
UPDATE collections
SET name = $1::text,
	updated_by = $2::uuid,
	updated_at = now()
WHERE id = $3::uuid
RETURNING id, created_at, created_by, updated_at, updated_by, name, user_id
`

type UpdateCollectionByIDParams struct {
	Name      string
	UpdatedBy uuid.UUID
	ID        uuid.UUID
}

func (q *queries) UpdateCollectionByID(ctx context.Context, arg UpdateCollectionByIDParams) (*domain.Collection, error) {
	row := q.tx.QueryRow(ctx, updateCollectionByID, arg.Name, arg.UpdatedBy, arg.ID)
	var collection domain.Collection
	err := row.Scan(
		&collection.ID,
		&collection.CreatedAt,
		&collection.CreatedBy,
		&collection.UpdatedAt,
		&collection.UpdatedBy,
		&collection.Name,
		&collection.UserID,
	)
	return &collection, err
}
