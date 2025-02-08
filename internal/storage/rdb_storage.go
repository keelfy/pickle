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
	"github.com/pickle.pw/monolith/internal/types"
)

type RelationalStorage interface {
	Queries() *db.Queries
	Begin(ctx context.Context) (pgx.Tx, error)
	Ping(ctx context.Context) error
	FindPaginatedGameNotesByUserId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort, filters types.Filters) ([]*db.FindPaginatedGameNotesByUserIdRow, error)
	FindSortedOrdersByReceiverId(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*db.Order, error)
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

const findPaginatedGameNotesByUserIdQuery = `
	SELECT 
		gn."id",
		gn."created_at",
		gn."name",
		gn."status",
		gn."rate",
		gn."comment",
		gn."release_date",
		gn."last_played_at",
		o."username" AS "initial_orderer_username",
		COALESCE(order_counts."count", 0) AS "orderer_count"
	FROM "game_notes" gn
		INNER JOIN "orderers" o ON gn."initial_orderer_id" = o."id"
		LEFT JOIN (
       	 	SELECT "game_note_id", COUNT(*) as "count" 
        	FROM "game_note_orders" 
        	GROUP BY "game_note_id"
    	) order_counts ON gn."id" = order_counts."game_note_id"
	WHERE gn."user_id" = $1 
		AND ($2::text IS NULL OR gn."%s" %s $2::%s)%s
	ORDER BY gn."%s" %s 
	LIMIT $3
`

const findPaginatedGameNotesByUserIdWithOrdererUsernameFilterQuery = `
	SELECT 
		gn."id",
		gn."created_at",
		gn."name",
		gn."status",
		gn."rate",
		gn."comment",
		gn."release_date",
		gn."last_played_at",
		o."username" AS "initial_orderer_username",
		COALESCE(order_counts."count", 0) AS "orderer_count"
	FROM "game_notes" gn
		INNER JOIN "orderers" o ON gn."initial_orderer_id" = o."id"
		INNER JOIN "game_note_orders" gno ON gn."id" = gno."game_note_id"
		INNER JOIN "orders" o1 ON gno."order_id" = o1."id"
		LEFT JOIN (
       	 	SELECT "game_note_id", COUNT(*) as "count" 
        	FROM "game_note_orders" 
        	GROUP BY "game_note_id"
    	) order_counts ON gn."id" = order_counts."game_note_id"
	WHERE gn."user_id" = $1 
		AND ($2::text IS NULL OR gn."%s" %s $2::%s)%s
	ORDER BY gn."%s" %s 
	LIMIT $3
`

// Queries game notes by receiver id with cursor pagination and dynamic sorting
func (sqlDb *relationalStorage) FindPaginatedGameNotesByUserId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort, filters types.Filters) ([]*db.FindPaginatedGameNotesByUserIdRow, error) {
	comparisonOperator := ">"
	if strings.ToUpper(sort.Direction) == "DESC" {
		comparisonOperator = "<"
	}

	columnType := getGameNoteColumnType(sort.Column)
	conditionalFilters := getGameNoteFilterQuery(filters)

	requesterFilter := filters["requester"]
	queryTemplate := findPaginatedGameNotesByUserIdQuery
	if requesterFilter != "" {
		queryTemplate = findPaginatedGameNotesByUserIdWithOrdererUsernameFilterQuery
	}

	query := fmt.Sprintf(queryTemplate,
		strings.ToLower(sort.Column),
		comparisonOperator,
		columnType,
		conditionalFilters,
		strings.ToLower(sort.Column),
		strings.ToUpper(sort.Direction))

	var (
		rows pgx.Rows
		err  error
	)

	rows, err = sqlDb.conn.Query(ctx, query, userID, sort.Cursor, sort.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*db.FindPaginatedGameNotesByUserIdRow
	for rows.Next() {
		var i db.FindPaginatedGameNotesByUserIdRow
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.Name,
			&i.Status,
			&i.Rate,
			&i.Comment,
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

func getGameNoteColumnType(column string) string {
	switch column {
	case "created_at", "last_played_at":
		return "timestamptz"
	case "name":
		return "text"
	case "rate":
		return "smallint"
	default:
		return "text"
	}
}

func getGameNoteFilterQuery(filters types.Filters) string {
	query := ""
	for key, value := range filters {
		switch key {
		case "status":
			query += fmt.Sprintf(" AND gn.\"%s\" = '%s'", key, value)
		case "requester":
			query += fmt.Sprintf(" AND o1.\"orderer_username\" ILIKE '%s'", value)
		}
	}
	return query
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
