package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

const findOrdererByID = `
SELECT 
	id, 
	user_id, 
	display_name, 
	source, 
	reference_user_id
FROM orderers
WHERE id = $1::uuid
`

func (q *queries) FindOrdererByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error) {
	row := q.tx.QueryRow(ctx, findOrdererByID, id)
	var i domain.Orderer
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.DisplayName,
		&i.Source,
		&i.ReferenceUserID,
	)
	return &i, err
}

const findOrdererWithUserByID = `
SELECT 
	orderers.id, 
	orderers.user_id, 
	orderers.display_name,
	orderers.source, 
	orderers.reference_user_id,
	profiles.username
FROM orderers
LEFT JOIN profiles ON profiles.user_id = orderers.user_id
WHERE orderers.id = $1::uuid
`

func (q *queries) FindOrdererWithUserByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error) {
	row := q.tx.QueryRow(ctx, findOrdererWithUserByID, id)
	orderer := &domain.Orderer{}
	var username *string
	err := row.Scan(
		&orderer.ID,
		&orderer.UserID,
		&orderer.DisplayName,
		&orderer.Source,
		&orderer.ReferenceUserID,
		&username,
	)
	if err != nil {
		return nil, err
	}
	if orderer.UserID != nil {
		orderer.User = &domain.User{
			ID:       *orderer.UserID,
			Username: *username,
		}
	}
	return orderer, nil
}

const findOrdererByUserID = `
SELECT 
	id, 
	user_id,
	display_name, 
	source, 
	reference_user_id
FROM orderers
WHERE user_id = $1::uuid
`

func (q *queries) FindOrdererByUserID(ctx context.Context, userID uuid.UUID) (*domain.Orderer, error) {
	row := q.tx.QueryRow(ctx, findOrdererByUserID, userID)
	i := &domain.Orderer{}
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.DisplayName,
		&i.Source,
		&i.ReferenceUserID,
	)
	return i, err
}

const insertOrdererManually = `
INSERT INTO orderers (
	created_by,
	updated_by,
	user_id,
	display_name,
	source,
	reference_user_id
)
VALUES (
	$1::uuid,
	$1::uuid,
	$2::uuid,
	$3::text,
	$4::text,
	NULL
) ON CONFLICT (source, user_id) DO
UPDATE SET 
	updated_at = now(),
	updated_by = $1::uuid,
	display_name = $3::text
RETURNING id, user_id, display_name, source, reference_user_id
`

type InsertOrdererManuallyParams struct {
	CreatedBy   *uuid.UUID `json:"created_by"`
	UserID      *uuid.UUID `json:"user_id"`
	DisplayName string     `json:"display_name"`
	Source      string     `json:"source"`
}

func (q *queries) InsertOrdererManually(ctx context.Context, arg InsertOrdererManuallyParams) (*domain.Orderer, error) {
	row := q.tx.QueryRow(ctx, insertOrdererManually,
		arg.CreatedBy,
		arg.UserID,
		arg.DisplayName,
		arg.Source,
	)
	i := &domain.Orderer{}
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.DisplayName,
		&i.Source,
		&i.ReferenceUserID,
	)
	return i, err
}

const insertReferencedOrderer = `
INSERT INTO orderers (
	created_by,
	updated_by,
	user_id,
	display_name,
	source,
	reference_user_id
)
VALUES (
	$1::uuid,
	$1::uuid,
	$2::uuid,
	$3::text,
	$4::text,
	$5::text
) ON CONFLICT (source, reference_user_id) DO
UPDATE
SET updated_at = now(),
	updated_by = $1::uuid,
	display_name = $3::text
RETURNING id, user_id, display_name, source, reference_user_id
`

type InsertReferencedOrdererParams struct {
	CreatedBy       *uuid.UUID
	UserID          *uuid.UUID
	DisplayName     string
	Source          string
	ReferenceUserID string
}

func (q *queries) InsertReferencedOrderer(ctx context.Context, arg InsertReferencedOrdererParams) (*domain.Orderer, error) {
	row := q.tx.QueryRow(ctx, insertReferencedOrderer,
		arg.CreatedBy,
		arg.UserID,
		arg.DisplayName,
		arg.Source,
		arg.ReferenceUserID,
	)
	var i domain.Orderer
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.DisplayName,
		&i.Source,
		&i.ReferenceUserID,
	)
	return &i, err
}

const updateOrdererByUserID = `
UPDATE orderers
SET updated_at = now(),
    updated_by = $1::uuid,
    display_name = $2::text
WHERE user_id = $3::uuid
`

type UpdateOrdererByUserIDParams struct {
	UpdatedBy   *uuid.UUID
	DisplayName string
	UserID      uuid.UUID
}

func (q *queries) UpdateOrdererByUserID(ctx context.Context, arg UpdateOrdererByUserIDParams) error {
	_, err := q.tx.Exec(ctx, updateOrdererByUserID,
		arg.UpdatedBy,
		arg.DisplayName,
		arg.UserID,
	)
	return err
}
