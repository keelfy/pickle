package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const cancelOrderDecisionsByContentNoteID = `
UPDATE order_decisions
SET deleted_at = now(),
    deleted_by = $1::uuid
WHERE content_note_id = $2::uuid
  AND content_note_category = $3::content_category
`

type CancelOrderDecisionsByContentNoteIDParams struct {
	DeletedBy           uuid.UUID
	ContentNoteID       uuid.UUID
	ContentNoteCategory domain.ContentCategory
}

func (q *queries) CancelOrderDecisionsByContentNoteID(ctx context.Context, arg CancelOrderDecisionsByContentNoteIDParams) error {
	_, err := q.tx.Exec(ctx, cancelOrderDecisionsByContentNoteID, arg.DeletedBy, arg.ContentNoteID, arg.ContentNoteCategory)
	return err
}

const countOrdersByContentNoteIDAndCategory = `
SELECT COUNT(*) AS count
FROM order_decisions
WHERE content_note_id = $1::uuid
  AND content_note_category = $2::content_category
  AND deleted_by IS NULL
`

func (q *queries) CountOrdersByContentNoteIDAndCategory(ctx context.Context, category domain.ContentCategory, contentNoteID uuid.UUID) (int64, error) {
	row := q.tx.QueryRow(ctx, countOrdersByContentNoteIDAndCategory, contentNoteID, category)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const insertOrderDecision = `
INSERT INTO order_decisions (
	order_id,
	decided_by,
	content_note_id,
	content_note_category,
	status
)
VALUES (
	$1::uuid,
	$2::uuid,
	$3::uuid,
	$4::content_category,
	$5::order_decision_status
)
RETURNING id, decided_at, decided_by, deleted_at, deleted_by, order_id, content_note_id, content_note_category, status
`

type InsertOrderDecisionParams struct {
	OrderID             uuid.UUID
	DecidedBy           uuid.UUID
	ContentNoteID       *uuid.UUID
	ContentNoteCategory *domain.ContentCategory
	Status              domain.OrderDecisionStatus
}

func (q *queries) InsertOrderDecision(ctx context.Context, arg InsertOrderDecisionParams) (*domain.OrderDecision, error) {
	row := q.tx.QueryRow(ctx, insertOrderDecision,
		arg.OrderID,
		arg.DecidedBy,
		arg.ContentNoteID,
		arg.ContentNoteCategory,
		arg.Status,
	)
	var i domain.OrderDecision
	err := row.Scan(
		&i.ID,
		&i.DecidedAt,
		&i.DecidedBy,
		&i.DeletedAt,
		&i.DeletedBy,
		&i.OrderID,
		&i.ContentNoteID,
		&i.ContentNoteCategory,
		&i.Status,
	)
	return &i, err
}

const findOrderDecisionsByOrderID = `
SELECT 
	od.id, 
	od.decided_at, 
	od.decided_by, 
	od.deleted_at, 
	od.deleted_by, 
	od.order_id, 
	od.content_note_id, 
	od.content_note_category, 
	od.status
FROM order_decisions od
WHERE order_id = $1::uuid 
`

func (q *queries) FindOrderDecisionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]*domain.OrderDecision, error) {
	rows, err := q.tx.Query(ctx, findOrderDecisionsByOrderID, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	decisions := make([]*domain.OrderDecision, 0)
	for rows.Next() {
		var i domain.OrderDecision
		err := rows.Scan(
			&i.ID,
			&i.DecidedAt,
			&i.DecidedBy,
			&i.DeletedAt,
			&i.DeletedBy,
			&i.OrderID,
			&i.ContentNoteID,
			&i.ContentNoteCategory,
			&i.Status,
		)
		if err != nil {
			return nil, err
		}
		decisions = append(decisions, &i)
	}
	return decisions, nil
}

const orderDecisionExistsByOrderID = `
SELECT EXISTS(
	SELECT 1
	FROM order_decisions
	WHERE order_id = $1::uuid AND deleted_by IS NULL
)
`

func (q *queries) OrderDecisionExistsByOrderID(ctx context.Context, orderID uuid.UUID) (bool, error) {
	row := q.tx.QueryRow(ctx, orderDecisionExistsByOrderID, orderID)
	var exists bool
	err := row.Scan(&exists)
	return exists, err
}
