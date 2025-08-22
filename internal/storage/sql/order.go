package sql

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const findOrderByID = `
SELECT 
	id, 
	created_at, 
	created_by, 
	updated_at, 
	updated_by, 
	receiver_id, 
	orderer_id, 
	message, 
	category, 
	anonymous, 
	source, 
	reference
FROM orders
WHERE id = $1::uuid
`

func (q *queries) FindOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	row := q.tx.QueryRow(ctx, findOrderByID, id)
	var i domain.Order
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.ReceiverID,
		&i.OrdererID,
		&i.Message,
		&i.Category,
		&i.Anonymous,
		&i.Source,
		&i.Reference,
	)
	return &i, err
}

const findOrderByIDWithOrderer = `
SELECT 
	o.id, 
	o.created_at, 
	o.created_by, 
	o.updated_at, 
	o.updated_by, 
	o.receiver_id, 
	o.message, 
	o.category, 
	o.anonymous, 
	o.source, 
	o.reference,
	-- orderer
	orderer.id AS orderer_id,
	orderer.display_name AS orderer_display_name,
	orderer.user_id AS orderer_user_id,
	orderer.source AS orderer_source,
	orderer.reference_user_id AS orderer_reference_user_id
FROM orders o
LEFT JOIN orderers orderer ON orderer.id = o.orderer_id
WHERE o.id = $1::uuid
`

func (q *queries) FindOrderByIDWithOrderer(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	row := q.tx.QueryRow(ctx, findOrderByIDWithOrderer, id)
	var i domain.Order
	var orderer domain.Orderer
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.ReceiverID,
		&i.Message,
		&i.Category,
		&i.Anonymous,
		&i.Source,
		&i.Reference,
		&orderer.ID,
		&orderer.DisplayName,
		&orderer.UserID,
		&orderer.Source,
		&orderer.ReferenceUserID,
	)
	i.OrdererID = orderer.ID
	i.Orderer = &orderer
	return &i, err
}

const countOrdersByReceiverID = `
SELECT COUNT(*) AS total
FROM orders
WHERE receiver_id = $1::uuid
`

func (q *queries) CountOrdersByReceiverID(ctx context.Context, receiverID uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, countOrdersByReceiverID, receiverID)
	var total int64
	err := row.Scan(&total)
	return total, err
}

const insertOrder = `
INSERT INTO orders (
	created_by,
	updated_by,
	receiver_id,
	orderer_id,
	category,
	content_id,
	message,
	source,
	reference,
	anonymous
)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::uuid,
	$4::uuid,
	$5::content_category,
	$6::uuid,
	$7::text,
	$8::text,
	$9::jsonb,
	$10::boolean
)
RETURNING 
	id, 
	created_at, 
	created_by, 
	updated_at, 
	updated_by,
	receiver_id, 
	orderer_id, 
	content_id,
	message, 
	category, 
	anonymous, 
	source, 
	reference
`

type InsertOrderParams struct {
	CreatedBy  *uuid.UUID
	UpdatedBy  *uuid.UUID
	ReceiverID uuid.UUID
	OrdererID  uuid.UUID
	Category   domain.ContentCategory
	ContentID  *uuid.UUID
	Message    string
	Source     domain.OrderSource
	Reference  json.RawMessage
	Anonymous  bool
}

func (q *queries) InsertOrder(ctx context.Context, arg InsertOrderParams) (*domain.Order, error) {
	row := q.tx.QueryRow(ctx, insertOrder,
		arg.CreatedBy,
		arg.UpdatedBy,
		arg.ReceiverID,
		arg.OrdererID,
		arg.Category,
		arg.ContentID,
		arg.Message,
		string(arg.Source),
		arg.Reference,
		arg.Anonymous,
	)
	var i domain.Order
	err := row.Scan(
		&i.ID,
		&i.CreatedAt,
		&i.CreatedBy,
		&i.UpdatedAt,
		&i.UpdatedBy,
		&i.ReceiverID,
		&i.OrdererID,
		&i.ContentID,
		&i.Message,
		&i.Category,
		&i.Anonymous,
		&i.Source,
		&i.Reference,
	)
	return &i, err
}

func getOrderFilterQuery(filters domain.Filters) string {
	query := ""
	for key, value := range filters {
		switch key {
		case "status":
			if value == "pending" {
				query += ` AND dec.status IS NULL`
			} else {
				query += fmt.Sprintf(` AND dec.status = '%s'`, value)
			}
		case "category":
			query += fmt.Sprintf(` AND orders.category = '%s'`, value)
		case "requester":
			query += fmt.Sprintf(` AND orer.display_name ILIKE '%s'`, value)
		case "source":
			query += fmt.Sprintf(` AND orders.source = '%s'`, value)
		}
	}
	return query
}

func getOrderFilterJoins(filters domain.Filters) string {
	query := ""
	if _, ok := filters["requester"]; ok {
		query = `JOIN orderers orer ON orer.id = orders.orderer_id`
	}

	if _, ok := filters["status"]; ok {
		query += `
		LEFT JOIN LATERAL (
			SELECT status
			FROM order_decisions
			WHERE order_id = orders.id AND deleted_by IS NULL
			ORDER BY decided_at DESC
			LIMIT 1
		) dec ON true
		`
	}
	return query
}

func getOrderSortColumn(sort *domain.CursorSort) string {
	query := ""
	switch sort.Column {
	case "updated_at":
		query = "orders.updated_at"
	case "message":
		query = "orders.message"
	case "category":
		query = "orders.category"
	default:
		query = "orders.created_at"
	}
	return query
}

func getOrderSortDirection(sort *domain.CursorSort) string {
	if strings.ToUpper(sort.Direction) == "ASC" {
		return "ASC"
	}
	return "DESC"
}

func getOrderColumnType(column string) string {
	switch column {
	case "created_at", "updated_at":
		return "timestamptz"
	default:
		return "text"
	}
}

const findOrdersByReceiverIdQuery = `
WITH base AS (
	SELECT 
		orders.id,
		orders.created_at,
		orders.receiver_id,
		orders.orderer_id,
		orders.message, 
		orders.category,
		orders.source, 
		orders.reference, 
		orders.anonymous,
		orders.content_id
	FROM orders
	%s -- joins for additional filtering
	WHERE orders.receiver_id = $1::uuid
	  AND ($2::text IS NULL OR %s %s $2::%s)
		%s -- filters
	ORDER BY %s %s, orders.id %s
	LIMIT $3::bigint
)
SELECT 
	-- order
	base.id,
	base.created_at,
	base.receiver_id,
	base.orderer_id,
	base.message, 
	base.category,
	base.source, 
	base.reference, 
	base.anonymous,
	base.content_id,
	-- order content
	CASE 
		WHEN base.category = 'games' THEN ogl.title
		WHEN base.category = 'movies' THEN oml.title
	END AS content_title,
	CASE
		WHEN base.category = 'games' THEN og.cover_key
		WHEN base.category = 'movies' THEN om.cover_key
	END AS content_cover_key,
	CASE
		WHEN base.category = 'games' THEN og.cover_key_type
		WHEN base.category = 'movies' THEN om.cover_key_type
	END AS content_cover_key_type,
	-- orderer
	orer.display_name AS orderer_display_name,
	orer.user_id AS orderer_user_id,
	orer.source AS orderer_source,
	-- decision
	dec.status AS decision_status,
	dec.content_note_id AS decision_content_note_id,
	dec.content_note_category AS decision_content_note_category,
	-- content
	CASE
		WHEN dec.content_note_category = 'games' THEN g.id
		WHEN dec.content_note_category = 'movies' THEN m.id
	END AS dec_content_id,
	CASE
		WHEN dec.content_note_category = 'games' THEN gl.title
		WHEN dec.content_note_category = 'movies' THEN ml.title
	END AS dec_content_title,
	CASE
		WHEN dec.content_note_category = 'games' THEN g.cover_key
		WHEN dec.content_note_category = 'movies' THEN m.cover_key
	END AS dec_content_cover_key,
	CASE
		WHEN dec.content_note_category = 'games' THEN g.cover_key_type
		WHEN dec.content_note_category = 'movies' THEN m.cover_key_type
	END AS dec_content_cover_key_type,
	-- decided by
	p.username AS decided_by_username,
	p.display_name AS decided_by_display_name
FROM base
JOIN orderers orer ON orer.id = base.orderer_id
-- order content
LEFT JOIN games og ON og.id = base.content_id
LEFT JOIN movies om ON om.id = base.content_id
-- localizations for the order content
LEFT JOIN game_localizations ogl ON ogl.content_id = og.id AND ogl.locale = $4::text
LEFT JOIN movie_localizations oml ON oml.content_id = om.id AND oml.locale = $4::text
-- decision related to the order
LEFT JOIN LATERAL (
  SELECT status, content_note_id, content_note_category, decided_by
  FROM order_decisions
  WHERE order_id = base.id AND deleted_by IS NULL
  ORDER BY decided_at DESC
  LIMIT 1
) dec ON true
-- decided by
LEFT JOIN profiles p ON p.user_id = dec.decided_by
-- content note related to the decision
LEFT JOIN game_notes gn ON gn.id = dec.content_note_id AND dec.content_note_category = 'games'
LEFT JOIN movie_notes mn ON mn.id = dec.content_note_id AND dec.content_note_category = 'movies'
-- content from content note
LEFT JOIN games g ON g.id = gn.content_id
LEFT JOIN movies m ON m.id = mn.content_id
-- localizations for the content from the decision
LEFT JOIN game_localizations gl ON gl.content_id = g.id AND gl.locale = $4::text
LEFT JOIN movie_localizations ml ON ml.content_id = m.id AND ml.locale = $4::text
ORDER BY %s %s, base.id %s
`

type FindSortedOrdersByReceiverIDParams struct {
	ReceiverID uuid.UUID
	Sort       *domain.CursorSort
	Filters    domain.Filters
	Locale     string
}

type FindSortedOrdersByReceiverIDRow struct {
	OrderID                     uuid.UUID
	CreatedAt                   time.Time
	ReceiverID                  uuid.UUID
	OrdererID                   uuid.UUID
	Message                     string
	Category                    string
	Source                      string
	Reference                   []byte
	Anonymous                   bool
	ContentID                   *uuid.UUID
	ContentTitle                *string
	ContentCoverKey             *string
	ContentCoverKeyType         *string
	OrdererDisplayName          string
	OrdererUserID               *uuid.UUID
	OrdererSource               string
	DecisionStatus              *string
	DecisionContentNoteID       *uuid.UUID
	DecisionContentNoteCategory *string
	DecisionContentID           *uuid.UUID
	DecisionContentTitle        *string
	DecisionContentCoverKey     *string
	DecisionContentCoverKeyType *string
	DecidedByUsername           *string
	DecidedByDisplayName        *string
}

func (q *queries) FindSortedOrdersByReceiverID(ctx context.Context, arg FindSortedOrdersByReceiverIDParams) ([]*domain.Order, error) {
	receiverID := arg.ReceiverID
	sort := arg.Sort
	filters := arg.Filters
	locale := arg.Locale

	sortDir := getOrderSortDirection(sort)
	comparisonOperator := ">"
	if sortDir == "DESC" {
		comparisonOperator = "<"
	}

	sortColumnType := getOrderColumnType(sort.Column)
	sortColumn := getOrderSortColumn(sort)
	filterQuery := getOrderFilterQuery(filters)
	filterJoins := getOrderFilterJoins(filters)
	query := fmt.Sprintf(findOrdersByReceiverIdQuery,
		filterJoins,
		sortColumn, comparisonOperator, sortColumnType,
		filterQuery,
		sortColumn, sortDir, sortDir,
		strings.ReplaceAll(sortColumn, "orders.", "base."), sortDir, sortDir,
	)
	rows, err := q.tx.Query(ctx, query, receiverID, sort.Cursor, sort.Limit, locale)
	if err != nil {
		return nil, err
	}

	defer rows.Close()
	var orders []*domain.Order
	for rows.Next() {
		var row FindSortedOrdersByReceiverIDRow
		if err := rows.Scan(
			&row.OrderID,
			&row.CreatedAt,
			&row.ReceiverID,
			&row.OrdererID,
			&row.Message,
			&row.Category,
			&row.Source,
			&row.Reference,
			&row.Anonymous,
			&row.ContentID,
			&row.ContentTitle,
			&row.ContentCoverKey,
			&row.ContentCoverKeyType,
			&row.OrdererDisplayName,
			&row.OrdererUserID,
			&row.OrdererSource,
			&row.DecisionStatus,
			&row.DecisionContentNoteID,
			&row.DecisionContentNoteCategory,
			&row.DecisionContentID,
			&row.DecisionContentTitle,
			&row.DecisionContentCoverKey,
			&row.DecisionContentCoverKeyType,
			&row.DecidedByUsername,
			&row.DecidedByDisplayName,
		); err != nil {
			return nil, err
		}

		order := &domain.Order{
			ID:         row.OrderID,
			CreatedAt:  row.CreatedAt,
			ReceiverID: row.ReceiverID,
			OrdererID:  row.OrdererID,
			Message:    row.Message,
			Category:   domain.ContentCategory(row.Category),
			Source:     domain.OrderSource(row.Source),
			Reference:  row.Reference,
			Anonymous:  row.Anonymous,
		}

		var content domain.IContent
		if row.ContentID != nil && row.ContentTitle != nil {
			var coverKeyType domain.ImageKeyType
			if row.ContentCoverKeyType != nil {
				coverKeyType = domain.ImageKeyType(*row.ContentCoverKeyType)
			}
			content = &domain.ContentBase{
				ID:           *row.ContentID,
				Title:        *row.ContentTitle,
				Category:     domain.ContentCategory(row.Category),
				CoverKey:     row.ContentCoverKey,
				CoverKeyType: &coverKeyType,
			}
		}
		order.Content = content

		orderer := &domain.Orderer{
			ID:          row.OrdererID,
			DisplayName: row.OrdererDisplayName,
			UserID:      row.OrdererUserID,
			Source:      domain.OrdererSource(row.OrdererSource),
		}
		order.Orderer = orderer

		var decision *domain.OrderDecision
		var decidedBy *domain.User

		if row.DecisionStatus != nil {
			var contentNoteCategory domain.ContentCategory
			if row.DecisionContentNoteCategory != nil {
				contentNoteCategory = domain.ContentCategory(*row.DecisionContentNoteCategory)
			}
			decision = &domain.OrderDecision{
				Status:              domain.OrderDecisionStatus(*row.DecisionStatus),
				ContentNoteID:       row.DecisionContentNoteID,
				ContentNoteCategory: &contentNoteCategory,
			}
		}

		var contentNote *domain.ContentNote
		var decisionContent *domain.ContentBase

		if row.DecisionContentNoteCategory != nil {
			if row.DecisionContentID != nil && row.DecisionContentTitle != nil {
				var coverKeyType domain.ImageKeyType
				if row.DecisionContentCoverKeyType != nil {
					coverKeyType = domain.ImageKeyType(*row.DecisionContentCoverKeyType)
				}
				decisionContent = &domain.ContentBase{
					ID:           *row.DecisionContentID,
					Title:        *row.DecisionContentTitle,
					Category:     domain.ContentCategory(*row.DecisionContentNoteCategory),
					CoverKey:     row.DecisionContentCoverKey,
					CoverKeyType: &coverKeyType,
				}
			}

			if row.DecisionContentNoteID != nil {
				contentNote = &domain.ContentNote{
					ID:       *row.DecisionContentNoteID,
					UserID:   order.ReceiverID,
					Content:  decisionContent,
					Category: domain.ContentCategory(*row.DecisionContentNoteCategory),
				}
				decision.ContentNote = contentNote
			}
		}

		if row.DecidedByUsername != nil && row.DecidedByDisplayName != nil {
			decidedBy = &domain.User{
				ID:          order.ReceiverID,
				Username:    *row.DecidedByUsername,
				DisplayName: *row.DecidedByDisplayName,
			}
			decision.DecidedBy = decidedBy.ID
			decision.DecidedByUser = decidedBy
		}

		if decision != nil {
			order.Decisions = append(order.Decisions, decision)
		}

		orders = append(orders, order)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return orders, nil
}

const findPaginatedOrdersByContentNoteID = `
SELECT 
	orders.id, 
	orders.created_at, 
	orders.created_by, 
	orders.updated_at, 
	orders.updated_by, 
	orders.receiver_id, 
	orders.orderer_id, 
	orders.message, 
	orders.category, 
	orders.anonymous, 
	orders.source, 
	orders.reference,
	-- orderer
	orer.source AS orderer_source,
	orer.display_name AS orderer_display_name,
	orer.user_id AS orderer_user_id
FROM orders
	LEFT JOIN orderers orer ON orer.id = orders.orderer_id
	INNER JOIN order_decisions od ON od.order_id = orders.id
	AND od.content_note_id = $1::uuid
	AND od.content_note_category = $2::content_category
	AND od.deleted_by IS NULL
ORDER BY od.decided_at DESC
LIMIT $4::bigint OFFSET $3::bigint
`

func (q *queries) FindPaginatedOrdersByContentNoteID(ctx context.Context, contentNoteID uuid.UUID, category domain.ContentCategory, sort *domain.Pagination) ([]*domain.Order, error) {
	rows, err := q.tx.Query(ctx, findPaginatedOrdersByContentNoteID, contentNoteID, category, sort.From, sort.Size)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.Order{}
	for rows.Next() {
		var i domain.Order
		var orderer domain.Orderer
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.CreatedBy,
			&i.UpdatedAt,
			&i.UpdatedBy,
			&i.ReceiverID,
			&i.OrdererID,
			&i.Message,
			&i.Category,
			&i.Anonymous,
			&i.Source,
			&i.Reference,
			&orderer.Source,
			&orderer.DisplayName,
			&orderer.UserID,
		); err != nil {
			return nil, err
		}
		orderer.ID = i.OrdererID
		i.Orderer = &orderer
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
