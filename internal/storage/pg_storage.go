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

type SQLDatabase interface {
	Queries() *db.Queries
	Begin(ctx context.Context) (pgx.Tx, error)
	Ping(ctx context.Context) error
	FindPaginatedGameNotesByUserId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.FindPaginatedGameNotesByUserIdRow, error)
	FindSortedOrdersByReceiverId(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*db.Order, error)
}

type sqlDatabase struct {
	conn    *pgxpool.Pool
	queries *db.Queries
}

func NewPGXPoolWithCleanup(ctx context.Context) (SQLDatabase, func(), error) {
	logger.Infof(ctx, "%v PostgreSQL %v", strings.Repeat("~", 12), strings.Repeat("~", 13))
	pool, err := pgxpool.New(ctx, config.GetDatabaseURL())
	if err != nil {
		return nil, nil, err
	}

	queries := db.New(pool)
	sqlDatabase := &sqlDatabase{
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

func (s *sqlDatabase) Queries() *db.Queries {
	return s.queries
}

func (s *sqlDatabase) Begin(ctx context.Context) (pgx.Tx, error) {
	return s.conn.Begin(ctx)
}

func (sqlDb *sqlDatabase) Ping(ctx context.Context) error {
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
		o."username" AS "initial_orderer_username"
	FROM "game_notes" gn
		JOIN "orderers" o ON gn."initial_orderer_id" = o."id"
	WHERE gn."user_id" = $1 
		AND gn."%s" %s $2 
	ORDER BY gn."%s" %s 
	LIMIT $3
`

// Queries game notes by receiver id with cursor pagination and dynamic sorting
func (sqlDb *sqlDatabase) FindPaginatedGameNotesByUserId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.FindPaginatedGameNotesByUserIdRow, error) {
	comparisonOperator := "<"
	if strings.ToUpper(sort.Direction) == "DESC" {
		comparisonOperator = ">"
	}

	query := fmt.Sprintf(findPaginatedGameNotesByUserIdQuery, sort.Column, comparisonOperator, strings.ToLower(sort.Column), strings.ToUpper(sort.Direction))
	rows, err := sqlDb.conn.Query(ctx, query, userID, sort.Cursor, sort.Limit)
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
			&i.InitialOrdererUsername,
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
func (sqlDb *sqlDatabase) FindSortedOrdersByReceiverId(ctx context.Context, receiverID uuid.UUID, sort *types.CursorSort) ([]*db.Order, error) {
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
