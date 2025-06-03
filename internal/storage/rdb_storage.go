package storage

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/types"
)

type RelationalStorage interface {
	Queries() *db.Queries
	Begin(ctx context.Context) (pgx.Tx, error)
	Ping(ctx context.Context) error
	FindPaginatedContentNotesByUserID(ctx context.Context, category db.ContentCategory, userID uuid.UUID, sort *types.CursorSort, filters types.Filters) ([]models.ContentNoteSearchResult, error)
	FindSortedOrdersByReceiverId(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*db.Order, error)
	CountNoteReactionsByNoteIDAndUserID(ctx context.Context, category db.ContentCategory, noteID uuid.UUID, userID uuid.UUID) (int64, error)
	InsertContentNoteReaction(ctx context.Context, category db.ContentCategory, reaction *models.Reaction, by uuid.UUID) error
	DeleteContentNoteReaction(ctx context.Context, category db.ContentCategory, reaction *models.Reaction) error
	FindContentNoteReactionsByContentNoteIdsAndUserId(ctx context.Context, category db.ContentCategory, contentNoteIDs uuid.UUIDs, userID uuid.UUID) ([]*models.ReactionStack, error)
}

type relationalStorage struct {
	conn    *pgxpool.Pool
	queries *db.Queries
}

func NewRelationalStorage(ctx context.Context) (RelationalStorage, func(), error) {
	logger.Infof(ctx, "%v PostgreSQL %v", strings.Repeat("~", 12), strings.Repeat("~", 13))
	pool, err := pgxpool.New(ctx, config.GetDatabaseURL())
	if err != nil {
		return nil, nil, err
	}

	queries := db.New(pool)
	sqlDatabase := &relationalStorage{
		conn:    pool,
		queries: queries,
	}

	logger.Infof(ctx, "Connection pool created")

	cleanup := func() {
		pool.Close()
	}
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return sqlDatabase, cleanup, nil
}

func (s *relationalStorage) Queries() *db.Queries {
	return s.queries
}

func (s *relationalStorage) Begin(ctx context.Context) (pgx.Tx, error) {
	return s.conn.Begin(ctx)
}

func (sqlDb *relationalStorage) Ping(ctx context.Context) error {
	err := sqlDb.conn.Ping(ctx)
	if err != nil {
		logger.Debugf(ctx, "[SQL] Error pinging PostgreSQL: %v", err)
		return err
	}
	return nil
}

func getNoteTableNameByCategory(category db.ContentCategory) (string, error) {
	switch category {
	case db.ContentCategoryGames:
		return "game_notes", nil
	case db.ContentCategoryMovies:
		return "movie_notes", nil
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
}

const findPaginatedContentNotesByUserIDQuery = `
	WITH filtered_notes AS (
		SELECT note.*
		FROM "%s" note
		WHERE note."user_id" = $1 
			AND ($2::text IS NULL OR note."%s" %s $2::%s)
			%s -- conditional filters
	)
	SELECT DISTINCT 
		note."id",
		note."created_at",
		note."name",
		note."status",
		note."rate",
		note."comment",
		note."poster_key",
		note."poster_updated_at",
		%s -- content specific columns
		o."username" AS "initial_orderer_username",
		COALESCE(order_counts."count", 0) AS "orderer_count"
	FROM filtered_notes note
		INNER JOIN "orderers" o ON note."initial_orderer_id" = o."id"
		%s -- optional joins
		LEFT JOIN LATERAL(
			SELECT COUNT(*) as "count" 
			FROM "%s_orders" 
			WHERE "%s_id" = note."id"
		) order_counts ON note."id" = order_counts."%s_id"
	ORDER BY note."%s" %s 
	LIMIT $3
`

func getContentNotePrefix(category db.ContentCategory) (string, error) {
	switch category {
	case db.ContentCategoryGames:
		return "game_note", nil
	case db.ContentCategoryMovies:
		return "movie_note", nil
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
}

func getContentNoteSelectedColumns(category db.ContentCategory) (string, error) {
	switch category {
	case db.ContentCategoryGames:
		return "note.\"release_date\", note.\"last_played_at\",", nil
	case db.ContentCategoryMovies:
		return "note.\"release_date\", note.\"watched_at\",", nil
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
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

func getContentNoteFilterQuery(filters types.Filters) string {
	query := ""
	for key, value := range filters {
		switch key {
		case "status":
			query += fmt.Sprintf(" AND note.\"%s\" = '%s'", key, value)
		case "requester":
			query += fmt.Sprintf(" AND orders.\"orderer_username\" ILIKE '%s'", value)
		}
	}
	return query
}

func (sqlDb *relationalStorage) FindPaginatedContentNotesByUserID(ctx context.Context, category db.ContentCategory, userID uuid.UUID, sort *types.CursorSort, filters types.Filters) ([]models.ContentNoteSearchResult, error) {
	tableName, err := getNoteTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	comparisonOperator := ">"
	if strings.ToUpper(sort.Direction) == "DESC" {
		comparisonOperator = "<"
	}

	columnType := getContentNoteColumnType(sort.Column)
	conditionalFilters := getContentNoteFilterQuery(filters)

	prefix, err := getContentNotePrefix(category)
	if err != nil {
		return nil, err
	}

	joins := ""
	if filters["requester"] != "" {
		joins = fmt.Sprintf(`
			INNER JOIN "%s_orders" note_orders ON note."id" = note_orders."%s_id"
			INNER JOIN orders ON note_orders."order_id" = orders."id"
		`, prefix, prefix)
	}

	selectedColumns, err := getContentNoteSelectedColumns(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findPaginatedContentNotesByUserIDQuery,
		tableName,              // content note table name
		conditionalFilters,     // conditional filters
		selectedColumns,        // content specific columns
		joins,                  // optional joins
		prefix, prefix, prefix, // note orders table name
		strings.ToLower(sort.Column), // sort column
		comparisonOperator,
		columnType,
		strings.ToLower(sort.Column),
		strings.ToUpper(sort.Direction),
	)

	rows, err := sqlDb.conn.Query(ctx, query, userID, sort.Cursor, sort.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	switch category {
	case db.ContentCategoryGames:
		return sqlDb.ReadGameNoteSearchResults(rows)
	case db.ContentCategoryMovies:
		return sqlDb.ReadMovieNoteSearchResults(rows)
	default:
		return nil, fmt.Errorf("invalid content category: %s", category)
	}
}

func (sqlDB *relationalStorage) ReadGameNoteSearchResults(rows pgx.Rows) ([]models.ContentNoteSearchResult, error) {
	var items []models.ContentNoteSearchResult

	for rows.Next() {
		var i models.GameNoteSearchResult
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.Name,
			&i.Status,
			&i.Rate,
			&i.Comment,
			&i.PosterKey,
			&i.PosterUpdatedAt,
			&i.ReleaseDate,
			&i.LastPlayedAt,
			&i.InitialOrdererUsername,
			&i.OrdererCount,
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

func (sqlDB *relationalStorage) ReadMovieNoteSearchResults(rows pgx.Rows) ([]models.ContentNoteSearchResult, error) {
	var items []models.ContentNoteSearchResult

	for rows.Next() {
		var i models.MovieNoteSearchResult
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.Name,
			&i.Status,
			&i.Rate,
			&i.Comment,
			&i.PosterKey,
			&i.PosterUpdatedAt,
			&i.ReleaseDate,
			&i.WatchedAt,
			&i.InitialOrdererUsername,
			&i.OrdererCount,
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

const findOrdersByReceiverIdQuery = `
	SELECT id, created_at, payment_type, amount, status, orderer_username, message, category, updated_message, updated_category
	FROM "orders"
	WHERE "receiver_id" = $1 
		AND "%s" %s $2 
	ORDER BY "%s" %s 
	LIMIT $3
`

// Queries orders by receiver id with cursor pagination and dynamic sorting
func (sqlDb *relationalStorage) FindSortedOrdersByReceiverId(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*db.Order, error) {
	comparisonOperator := "<"
	if strings.ToUpper(sort.Direction) == "DESC" {
		comparisonOperator = ">"
	}

	query := fmt.Sprintf(findOrdersByReceiverIdQuery, sort.Column, comparisonOperator, strings.ToLower(sort.Column), strings.ToUpper(sort.Direction))
	rows, err := sqlDb.conn.Query(ctx, query, receiverID, sort.Cursor, sort.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*db.Order
	for rows.Next() {
		var i db.Order
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.PaymentType,
			&i.Amount,
			&i.Status,
			&i.OrdererUsername,
			&i.Message,
			&i.Category,
			&i.UpdatedMessage,
			&i.UpdatedCategory,
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

func (sqlDB *relationalStorage) CountNoteReactionsByNoteIDAndUserID(ctx context.Context, category db.ContentCategory, noteID uuid.UUID, userID uuid.UUID) (int64, error) {
	var (
		count int64
		err   error
	)

	switch category {
	case db.ContentCategoryGames:
		count, err = sqlDB.Queries().CountGameNoteReactionsByGameNoteIdAndUserId(ctx, db.CountGameNoteReactionsByGameNoteIdAndUserIdParams{
			GameNoteID: noteID,
			UserID:     userID,
		})
	case db.ContentCategoryMovies:
		count, err = sqlDB.Queries().CountMovieNoteReactionsByMovieNoteIdAndUserId(ctx, db.CountMovieNoteReactionsByMovieNoteIdAndUserIdParams{
			MovieNoteID: noteID,
			UserID:      userID,
		})
	default:
		return 0, fmt.Errorf("invalid content category: %s", category)
	}
	return count, err
}

func (sqlDB *relationalStorage) InsertContentNoteReaction(ctx context.Context, category db.ContentCategory, reaction *models.Reaction, by uuid.UUID) error {
	switch category {
	case db.ContentCategoryGames:
		return sqlDB.Queries().AddGameNoteReaction(ctx, db.AddGameNoteReactionParams{
			GameNoteID: reaction.ContentNoteID,
			UserID:     reaction.UserID,
			EmoteID:    reaction.EmoteID,
			Source:     reaction.Source,
			CreatedBy:  by,
		})
	case db.ContentCategoryMovies:
		return sqlDB.Queries().AddMovieNoteReaction(ctx, db.AddMovieNoteReactionParams{
			MovieNoteID: reaction.ContentNoteID,
			UserID:      reaction.UserID,
			EmoteID:     reaction.EmoteID,
			Source:      reaction.Source,
		})
	default:
		return fmt.Errorf("invalid content category: %s", category)
	}
}

func (sqlDB *relationalStorage) DeleteContentNoteReaction(ctx context.Context, category db.ContentCategory, reaction *models.Reaction) error {
	switch category {
	case db.ContentCategoryGames:
		return sqlDB.Queries().RemoveGameNoteReaction(ctx, db.RemoveGameNoteReactionParams{
			GameNoteID: reaction.ContentNoteID,
			UserID:     reaction.UserID,
			EmoteID:    reaction.EmoteID,
			Source:     reaction.Source,
		})
	case db.ContentCategoryMovies:
		return sqlDB.Queries().RemoveMovieNoteReaction(ctx, db.RemoveMovieNoteReactionParams{
			MovieNoteID: reaction.ContentNoteID,
			UserID:      reaction.UserID,
			EmoteID:     reaction.EmoteID,
			Source:      reaction.Source,
		})
	default:
		return fmt.Errorf("invalid content category: %s", category)
	}
}

func (sqlDB *relationalStorage) FindContentNoteReactionsByContentNoteIdsAndUserId(ctx context.Context, category db.ContentCategory, contentNoteIDs uuid.UUIDs, userID uuid.UUID) ([]*models.ReactionStack, error) {
	switch category {
	case db.ContentCategoryGames:
		rows, err := sqlDB.Queries().GetGameNoteReactionsByGameNoteIdInAndUserId(ctx, db.GetGameNoteReactionsByGameNoteIdInAndUserIdParams{
			GameNoteIds: contentNoteIDs,
			UserID:      userID,
		})
		if err != nil {
			return nil, err
		}

		stack := make([]*models.ReactionStack, len(rows))
		for i, row := range rows {
			stack[i] = &models.ReactionStack{
				ContentNoteID: row.GameNoteID,
				EmoteID:       row.EmoteID,
				Source:        row.Source,
				Count:         row.Count,
				UserReacted:   row.ReactedByUser != nil && *row.ReactedByUser > 0,
			}
		}
		return stack, nil
	case db.ContentCategoryMovies:
		rows, err := sqlDB.Queries().GetMovieNoteReactionsByMovieNoteIdInAndUserId(ctx, db.GetMovieNoteReactionsByMovieNoteIdInAndUserIdParams{
			MovieNoteIds: contentNoteIDs,
			UserID:       userID,
		})

		if err != nil {
			return nil, err
		}

		stack := make([]*models.ReactionStack, len(rows))
		for i, row := range rows {
			stack[i] = &models.ReactionStack{
				ContentNoteID: row.MovieNoteID,
				EmoteID:       row.EmoteID,
				Source:        row.Source,
				Count:         row.Count,
				UserReacted:   row.ReactedByUser != nil && *row.ReactedByUser > 0,
			}
		}
		return stack, nil
	default:
		return nil, fmt.Errorf("invalid content category: %s", category)
	}
}
