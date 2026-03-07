package sql

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/domain"
)

func getContentNoteTableNameByCategory(category domain.ContentCategory) (string, error) {
	switch category {
	case domain.ContentCategoryGames:
		return "game_notes", nil
	case domain.ContentCategoryMovies:
		return "movie_notes", nil
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
}

func getDetailedContentNoteColumnsToSelect(category domain.ContentCategory) (string, error) {
	columns := []string{}
	switch category {
	case domain.ContentCategoryGames:
		columns = append(columns, "note.last_played_at")
	case domain.ContentCategoryMovies:
		columns = append(columns, "note.watched_at")
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
	return strings.Join(columns, ", ") + ",", nil
}

func getContentNoteColumnType(column string) string {
	switch column {
	case "created_at", "last_played_at", "watched_at":
		return "timestamptz"
	case "name":
		return "text"
	case "rate":
		return "smallint"
	default:
		return "text"
	}
}

func getContentNoteFilterQuery(filters domain.Filters) string {
	query := ""
	for key, value := range filters {
		switch key {
		case "status":
			query += fmt.Sprintf(` AND note.%s = '%s'`, key, value)
		case "requester":
			query += fmt.Sprintf(` AND orer.display_name ILIKE '%s'`, value)
		}
	}
	return query
}

func scanContentNote(row pgx.Row, category domain.ContentCategory) (domain.IContentNote, error) {
	switch category {
	case domain.ContentCategoryGames:
		content := &domain.Game{
			ContentBase: &domain.ContentBase{},
		}
		gameNote := &domain.ContentNote{}
		err := row.Scan(
			&gameNote.ID,
			&gameNote.UserID,
			&content.ID,
			&content.CoverKey,
			&content.CoverKeyType,
			&content.ReleaseDate,
			&content.Title,
		)
		gameNote.Content = content
		return gameNote, err
	case domain.ContentCategoryMovies:
		content := &domain.Movie{
			ContentBase: &domain.ContentBase{},
		}
		movieNote := &domain.ContentNote{}
		err := row.Scan(
			&movieNote.ID,
			&movieNote.UserID,
			&content.ID,
			&content.CoverKey,
			&content.CoverKeyType,
			&content.ReleaseDate,
			&content.Title,
		)
		movieNote.Content = content
		return movieNote, err
	default:
		return nil, fmt.Errorf("invalid content category: %s", category)
	}
}

const findContentNoteByID = `
SELECT 
	note.id, 
	note.user_id,
	content.id,
	content.cover_key,
	content.cover_key_type,
	%s
  COALESCE(localizations.title, 'Untitled') AS title
FROM %s note
LEFT JOIN %s content ON note.content_id = content.id
LEFT JOIN %s localizations ON content.id = localizations.content_id
  AND localizations.locale = $1::text
WHERE note.id = $2::uuid
`

func (q *queries) FindContentNoteByID(ctx context.Context, category domain.ContentCategory, noteID uuid.UUID, locale string) (domain.IContentNote, error) {
	tableName, err := getContentNoteTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	localizationTableName, err := getContentLocalizationTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	contentTableName, err := getContentTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	contentColumns, err := getContentColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findContentNoteByID, contentColumns, tableName, contentTableName, localizationTableName)

	row := q.tx.QueryRow(ctx, query, locale, noteID)
	return scanContentNote(row, category)
}

const checkIfContentNoteExistsByContentID = `
SELECT EXISTS(SELECT 1 FROM %s WHERE content_id = $1::uuid)
`

func (q *queries) CheckIfContentNoteExistsByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID) (bool, error) {
	tableName, err := getContentNoteTableNameByCategory(category)
	if err != nil {
		return false, err
	}

	query := fmt.Sprintf(checkIfContentNoteExistsByContentID, tableName)

	row := q.tx.QueryRow(ctx, query, contentID)
	var exists bool
	err = row.Scan(&exists)
	return exists, err
}

const findContentNoteByContentID = `
SELECT 
	note.id, 
	note.user_id,
	note.content_id,
	content.cover_key,
	content.cover_key_type,
	%s
  COALESCE(localizations.title, 'Untitled') AS title
FROM %s note
LEFT JOIN %s content ON note.content_id = content.id
LEFT JOIN %s localizations ON note.content_id = localizations.content_id
  AND localizations.locale = $1::text
WHERE note.content_id = $2::uuid AND note.user_id = $3::uuid
`

func (q *queries) FindContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID, locale string) (domain.IContentNote, error) {
	noteTableName, err := getContentNoteTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	localizationTableName, err := getContentLocalizationTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	selectedColumns, err := getDetailedContentNoteColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	contentTableName, err := getContentTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findContentNoteByContentID, selectedColumns, noteTableName, contentTableName, localizationTableName)

	row := q.tx.QueryRow(ctx, query, locale, contentID, userID)
	return scanContentNote(row, category)
}

const findDetailedContentNoteByContentID = `
WITH order_counts AS (
	SELECT od.content_note_id,
		od.content_note_category,
		COUNT(*) as count
	FROM order_decisions od
	WHERE od.deleted_by IS NULL
	GROUP BY od.content_note_id,
		od.content_note_category
)
SELECT 
	note.id,
	note.created_at, 
	note.updated_at, 
	note.user_id, 
	note.rate, 
	note.comment, 
	note.initial_orderer_id, 
	note.status, 
	%s
	content.id,
  COALESCE(localizations.title, 'Untitled') AS title,
	%s
  content.cover_key,
  content.cover_key_type,
  content.source_url,
  content.source_type,
  content.websites,
  COALESCE(order_counts.count, 0) AS order_count,
	-- initial orderer
	o.user_id AS initial_orderer_user_id,
	o.display_name AS initial_orderer_display_name,
	o.source AS initial_orderer_source
FROM %s note
  LEFT JOIN %s content ON note.content_id = content.id
  LEFT JOIN %s localizations ON content.id = localizations.content_id
	AND localizations.locale = $3::text
	LEFT JOIN order_counts ON note.id = order_counts.content_note_id
	AND order_counts.content_note_category = $4::content_category
	LEFT JOIN orderers o ON note.initial_orderer_id = o.id
WHERE note.content_id = $1::uuid AND note.user_id = $2::uuid
`

func (q *queries) FindDetailedContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID, locale string) (domain.IDetailedContentNote, error) {
	noteTableName, err := getContentNoteTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	localizationTableName, err := getContentLocalizationTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	selectedColumns, err := getDetailedContentNoteColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	contentColumns, err := getContentColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	contentTableName, err := getContentTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findDetailedContentNoteByContentID, selectedColumns, contentColumns, noteTableName, contentTableName, localizationTableName)

	row := q.tx.QueryRow(ctx, query, contentID, userID, locale, category)
	return scanDetailedContentNote(row, category)
}

func scanDetailedContentNote(row pgx.Row, category domain.ContentCategory) (domain.IDetailedContentNote, error) {
	switch category {
	case domain.ContentCategoryGames:
		content := &domain.DetailedGame{
			Game: &domain.Game{
				ContentBase: &domain.ContentBase{},
			},
			DetailedContentBase: &domain.DetailedContentBase{},
		}
		note := &domain.DetailedGameNote{
			DetailedContentNote: &domain.DetailedContentNote{
				ContentNote:    &domain.ContentNote{},
				InitialOrderer: &domain.Orderer{},
			},
		}
		err := row.Scan(
			&note.ContentNote.ID,
			&note.CreatedAt,
			&note.UpdatedAt,
			&note.ContentNote.UserID,
			&note.Rate,
			&note.Comment,
			&note.InitialOrdererID,
			&note.Status,
			&note.LastPlayedAt,
			&content.ID,
			&content.Title,
			&content.ReleaseDate,
			&content.CoverKey,
			&content.CoverKeyType,
			&content.SourceURL,
			&content.SourceType,
			&content.Websites,
			&note.OrdererCount,
			&note.InitialOrderer.UserID,
			&note.InitialOrderer.DisplayName,
			&note.InitialOrderer.Source,
		)
		note.ContentNote.Category = domain.ContentCategoryGames
		note.InitialOrderer.ID = note.InitialOrdererID
		note.DetailedContentNote.ContentNote.Content = content
		return note, err
	case domain.ContentCategoryMovies:
		content := &domain.DetailedMovie{
			Movie: &domain.Movie{
				ContentBase: &domain.ContentBase{},
			},
			DetailedContentBase: &domain.DetailedContentBase{},
		}
		note := &domain.DetailedMovieNote{
			DetailedContentNote: &domain.DetailedContentNote{
				ContentNote:    &domain.ContentNote{},
				InitialOrderer: &domain.Orderer{},
			},
		}
		err := row.Scan(
			&note.ContentNote.ID,
			&note.CreatedAt,
			&note.UpdatedAt,
			&note.ContentNote.UserID,
			&note.Rate,
			&note.Comment,
			&note.InitialOrdererID,
			&note.Status,
			&note.WatchedAt,
			&content.ID,
			&content.Title,
			&content.ReleaseDate,
			&content.CoverKey,
			&content.CoverKeyType,
			&content.SourceURL,
			&content.SourceType,
			&content.Websites,
			&note.OrdererCount,
			&note.InitialOrderer.UserID,
			&note.InitialOrderer.DisplayName,
			&note.InitialOrderer.Source,
		)
		note.ContentNote.Category = domain.ContentCategoryMovies
		note.InitialOrderer.ID = note.InitialOrdererID
		note.DetailedContentNote.ContentNote.Content = content
		return note, err
	default:
		return nil, fmt.Errorf("invalid content category: %s", category)
	}
}

const findDetailedContentNoteByID = `
WITH order_counts AS (
	SELECT od.content_note_id,
		od.content_note_category,
		COUNT(*) as count
	FROM order_decisions od
	WHERE od.deleted_by IS NULL
	GROUP BY od.content_note_id,
		od.content_note_category
)
SELECT 
	note.id,
	note.created_at, 
	note.updated_at, 
	note.user_id, 
	note.rate, 
	note.comment, 
	note.initial_orderer_id, 
	note.status, 
	%s
	content.id,
  COALESCE(localizations.title, 'Untitled') AS title,
	%s
  content.cover_key,
  content.cover_key_type,
  content.source_url,
  content.source_type,
  content.websites,
  COALESCE(order_counts.count, 0) AS order_count,
	-- initial orderer
	o.user_id AS initial_orderer_user_id,
	o.display_name AS initial_orderer_display_name,
	o.source AS initial_orderer_source
FROM %s note
  LEFT JOIN %s content ON note.content_id = content.id
  LEFT JOIN %s localizations ON content.id = localizations.content_id
	AND localizations.locale = $3::text
	LEFT JOIN order_counts ON note.id = order_counts.content_note_id
	AND order_counts.content_note_category = $2::content_category
	LEFT JOIN orderers o ON note.initial_orderer_id = o.id
WHERE note.id = $1::uuid
`

func (q *queries) FindDetailedContentNoteByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory, locale string) (domain.IDetailedContentNote, error) {
	tableName, err := getContentNoteTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	detailedContentNoteColumns, err := getDetailedContentNoteColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	contentColumns, err := getContentColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	contentTableName, err := getContentTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	localizationTableName, err := getContentLocalizationTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findDetailedContentNoteByID, detailedContentNoteColumns, contentColumns, tableName, contentTableName, localizationTableName)

	row := q.tx.QueryRow(ctx, query, id, category, locale)
	return scanDetailedContentNote(row, category)
}

const deleteContentNoteByID = `
DELETE FROM %s
WHERE id = $1::uuid
`

func (q *queries) DeleteContentNoteByID(ctx context.Context, category domain.ContentCategory, id uuid.UUID) error {
	tableName, err := getContentNoteTableNameByCategory(category)
	if err != nil {
		return err
	}

	_, err = q.tx.Exec(ctx, deleteContentNoteByID, tableName, id)
	return err
}

const findPaginatedContentNotesByUserIDQuery = `
	WITH filtered_notes AS (
		SELECT note.*
		FROM %s note
		%s -- optional joins
		WHERE note.user_id = $1::uuid
		  AND ($2::text IS NULL OR note.%s %s $2::%s)
		  %s -- conditional filters
	)
	SELECT DISTINCT 
		-- content note columns
		note.id,
		note.created_at,
		note.updated_at,
		note.user_id,
		note.rate,
		note.comment,
		note.initial_orderer_id,
		note.status,
		%s -- content note category-specific columns
		-- content columns
		content.id,
		localizations.title AS content_title,
		%s -- content category-specific columns
		content.cover_key,
		content.cover_key_type,
		content.source_url,
		content.source_type,
		content.websites,
		-- order counts
		COALESCE(order_counts.count, 0) AS orderer_count,
		orderer.user_id AS initial_orderer_user_id,
		orderer.display_name AS initial_orderer_display_name,
		orderer.source AS initial_orderer_source
	FROM filtered_notes note
		INNER JOIN %s content ON note.content_id = content.id
		INNER JOIN %s localizations ON content.id = localizations.content_id AND localizations.locale = $4::text
		INNER JOIN orderers orderer ON note.initial_orderer_id = orderer.id
		LEFT JOIN LATERAL(
			SELECT 
				od.content_note_id AS note_id,
				od.content_note_category AS note_category,
				COUNT(*) as count
			FROM order_decisions od
			WHERE od.deleted_by IS NULL
			GROUP BY od.content_note_id, od.content_note_category
		) order_counts ON note.id = order_counts.note_id AND order_counts.note_category = $5::content_category	
	ORDER BY note.%s %s 
	LIMIT $3
`

type FindPaginatedContentNotesByUserIDParams struct {
	UserID   uuid.UUID
	Sort     *domain.CursorSort
	Filters  domain.Filters
	Locale   string
	Category domain.ContentCategory
}

func (q *queries) FindPaginatedContentNotesByUserID(ctx context.Context, params FindPaginatedContentNotesByUserIDParams) ([]domain.IDetailedContentNote, error) {
	tableName, err := getContentNoteTableNameByCategory(params.Category)
	if err != nil {
		return nil, err
	}

	contentTableName, err := getContentTableNameByCategory(params.Category)
	if err != nil {
		return nil, err
	}

	contentLocalizationTableName, err := getContentLocalizationTableNameByCategory(params.Category)
	if err != nil {
		return nil, err
	}

	comparisonOperator := ">"
	if strings.ToUpper(params.Sort.Direction) == "DESC" {
		comparisonOperator = "<"
	}

	columnType := getContentNoteColumnType(params.Sort.Column)
	conditionalFilters := getContentNoteFilterQuery(params.Filters)

	joins := ""
	if params.Filters["requester"] != "" {
		joins = fmt.Sprintf(`
			INNER JOIN order_decisions od ON od.content_note_id = note.id
			AND od.content_note_category = '%s'
			AND od.deleted_by IS NULL
			AND od.status = 'approved'
			INNER JOIN orders o ON o.id = od.order_id
			INNER JOIN orderers orer ON orer.id = o.orderer_id
			`, params.Category)
	}

	noteSelectedColumns, err := getDetailedContentNoteColumnsToSelect(params.Category)
	if err != nil {
		return nil, err
	}

	selectedColumns, err := getContentColumnsToSelect(params.Category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findPaginatedContentNotesByUserIDQuery,
		tableName,                           // content note table name
		joins,                               // optional joins
		strings.ToLower(params.Sort.Column), // sort column
		comparisonOperator,                  // sort comparison type
		columnType,                          // sort column type
		conditionalFilters,                  // conditional filters
		noteSelectedColumns,                 // note specific columns
		selectedColumns,                     // content specific columns
		contentTableName,
		contentLocalizationTableName,
		strings.ToLower(params.Sort.Column),
		strings.ToUpper(params.Sort.Direction),
	)

	rows, err := q.tx.Query(ctx, query, params.UserID, params.Sort.Cursor, params.Sort.Limit, params.Locale, params.Category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.IDetailedContentNote
	for rows.Next() {
		note, err := scanDetailedContentNote(rows, params.Category)
		if err != nil {
			return nil, err
		}
		items = append(items, note)
	}
	return items, nil
}

const findContentNoteIDsWithContentIDsByUserID = `
SELECT 
	note.id,
	'games' AS category,
	note.content_id
FROM game_notes note
WHERE note.user_id = $1::uuid
UNION ALL
SELECT 
	note.id,
	'movies' AS category,
	note.content_id
FROM movie_notes note
WHERE note.user_id = $1::uuid
`

type FindContentNoteIDsWithContentIDsByUserIDResult struct {
	NoteID    uuid.UUID
	Category  domain.ContentCategory
	ContentID uuid.UUID
}

func (q *queries) FindContentNoteIDsWithContentIDsByUserID(ctx context.Context, userID uuid.UUID) ([]*FindContentNoteIDsWithContentIDsByUserIDResult, error) {
	query := findContentNoteIDsWithContentIDsByUserID
	rows, err := q.tx.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]*FindContentNoteIDsWithContentIDsByUserIDResult, 0)
	for rows.Next() {
		var result FindContentNoteIDsWithContentIDsByUserIDResult
		err := rows.Scan(
			&result.NoteID,
			&result.Category,
			&result.ContentID,
		)
		if err != nil {
			return nil, err
		}
		ids = append(ids, &result)
	}
	return ids, nil
}
