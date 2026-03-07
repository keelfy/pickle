package sql

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/mapper"
)

const findProfileByID = `
SELECT 
	user_id, 
	created_at,
	updated_at,
	updated_by,
	display_name, 
	username,
	description,
	suggestion_preferences,
	links
FROM profiles
WHERE user_id = $1::uuid
`

func (q *queries) FindProfileByID(ctx context.Context, userID uuid.UUID) (*domain.DetailedUser, error) {
	row := q.tx.QueryRow(ctx, findProfileByID, userID)
	var user domain.User
	var detailedUser domain.DetailedUser
	var suggestionPreferences json.RawMessage
	var links json.RawMessage
	err := row.Scan(
		&user.ID,
		&detailedUser.CreatedAt,
		&detailedUser.UpdatedAt,
		&detailedUser.UpdatedBy,
		&user.DisplayName,
		&user.Username,
		&detailedUser.Description,
		&suggestionPreferences,
		&links,
	)
	detailedUser.User = &user
	detailedUser.SuggestionPreferences = mapper.MapDBSuggestionPreferencesToDomain(suggestionPreferences)
	detailedUser.Links = mapper.MapDBLinksToDomain(links)
	return &detailedUser, err
}

const findUserByUsername = `
SELECT 
	user_id, 
	display_name, 
	username
FROM profiles
WHERE username = $1::text
`

func (q *queries) FindUserByUsername(ctx context.Context, username string) (*domain.User, error) {
	row := q.tx.QueryRow(ctx, findUserByUsername, username)
	var i domain.User
	err := row.Scan(
		&i.ID,
		&i.DisplayName,
		&i.Username,
	)
	return &i, err
}

const findDetailedUserByUsername = `
SELECT 
	user_id, 
	display_name, 
	username,
	created_at,
	updated_at,
	updated_by,
	description,
	suggestion_preferences,
	links
FROM profiles
WHERE username = $1::text
`

func (q *queries) FindDetailedUserByUsername(ctx context.Context, username string) (*domain.DetailedUser, error) {
	row := q.tx.QueryRow(ctx, findDetailedUserByUsername, username)
	var user domain.User
	var detailedUser domain.DetailedUser
	var suggestionPreferences json.RawMessage
	var links json.RawMessage
	err := row.Scan(
		&user.ID,
		&user.DisplayName,
		&user.Username,
		&detailedUser.CreatedAt,
		&detailedUser.UpdatedAt,
		&detailedUser.UpdatedBy,
		&detailedUser.Description,
		&suggestionPreferences,
		&links,
	)
	detailedUser.User = &user
	detailedUser.SuggestionPreferences = mapper.MapDBSuggestionPreferencesToDomain(suggestionPreferences)
	detailedUser.Links = mapper.MapDBLinksToDomain(links)
	return &detailedUser, err
}

const updateProfileByUserID = `
UPDATE profiles
SET updated_at = now(),
    updated_by = $1::uuid,
    display_name = $2::text,
    username = $3::text,
    description = $4::text,
    links = $5::jsonb,
    suggestion_preferences = $6::jsonb
WHERE user_id = $7::uuid
`

type UpdateProfileByUserIDParams struct {
	UpdatedBy             uuid.UUID
	DisplayName           string
	Username              string
	Description           string
	Links                 json.RawMessage
	SuggestionPreferences json.RawMessage
	UserID                uuid.UUID
}

func (q *queries) UpdateProfileByUserID(ctx context.Context, arg UpdateProfileByUserIDParams) error {
	_, err := q.tx.Exec(ctx, updateProfileByUserID,
		arg.UpdatedBy,
		arg.DisplayName,
		arg.Username,
		arg.Description,
		arg.Links,
		arg.SuggestionPreferences,
		arg.UserID,
	)
	return err
}

const updateProfileSuggestionPreferences = `
UPDATE profiles
SET suggestion_preferences = $1::jsonb,
    updated_at = now(),
    updated_by = $2::uuid
WHERE user_id = $3::uuid
`

type UpdateProfileSuggestionPreferencesParams struct {
	SuggestionPreferences json.RawMessage
	UpdatedBy             uuid.UUID
	UserID                uuid.UUID
}

func (q *queries) UpdateProfileSuggestionPreferences(ctx context.Context, arg UpdateProfileSuggestionPreferencesParams) error {
	_, err := q.tx.Exec(ctx, updateProfileSuggestionPreferences, arg.SuggestionPreferences, arg.UpdatedBy, arg.UserID)
	return err
}

const insertProfile = `
INSERT INTO profiles (
	user_id,
	display_name,
	username,
	description,
	suggestion_preferences,
	links
)
VALUES (
	$1::uuid,
	$2::text,
	$3::text,
	$4::text,
	$5::jsonb,
	$6::jsonb
)
RETURNING 
	user_id, 
	display_name, 
	username, 
	description, 
	suggestion_preferences, 
	links
`

type InsertProfileParams struct {
	UserID                uuid.UUID
	DisplayName           string
	Username              string
	Description           string
	SuggestionPreferences json.RawMessage
	Links                 json.RawMessage
}

func (q *queries) InsertProfile(ctx context.Context, arg InsertProfileParams) (*domain.DetailedUser, error) {
	row := q.tx.QueryRow(ctx, insertProfile,
		arg.UserID,
		arg.DisplayName,
		arg.Username,
		arg.Description,
		arg.SuggestionPreferences,
		arg.Links,
	)
	var user domain.User
	var detailedUser domain.DetailedUser
	var suggestionPreferences json.RawMessage
	var links json.RawMessage
	err := row.Scan(
		&user.ID,
		&user.DisplayName,
		&user.Username,
		&detailedUser.Description,
		&suggestionPreferences,
		&links,
	)
	detailedUser.User = &user
	detailedUser.SuggestionPreferences = mapper.MapDBSuggestionPreferencesToDomain(suggestionPreferences)
	detailedUser.Links = mapper.MapDBLinksToDomain(links)
	return &detailedUser, err
}

const getUserFollows = `
SELECT 
	p.user_id, 
	p.created_at, 
	p.updated_at, 
	p.updated_by, 
	p.display_name, 
	p.username, 
	p.description, 
	p.suggestion_preferences, 
	p.links
FROM profiles p
	JOIN followers f ON p.user_id = f.user_id
WHERE f.follower_id = $1::uuid
ORDER BY f.created_at DESC
`

func (q *queries) GetUserFollows(ctx context.Context, followerID uuid.UUID) ([]*domain.DetailedUser, error) {
	rows, err := q.tx.Query(ctx, getUserFollows, followerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.DetailedUser{}
	for rows.Next() {
		var user domain.User
		var detailedUser domain.DetailedUser
		var suggestionPreferences json.RawMessage
		var links json.RawMessage
		if err := rows.Scan(
			&user.ID,
			&detailedUser.CreatedAt,
			&detailedUser.UpdatedAt,
			&detailedUser.UpdatedBy,
			&user.DisplayName,
			&user.Username,
			&detailedUser.Description,
			&suggestionPreferences,
			&links,
		); err != nil {
			return nil, err
		}
		detailedUser.User = &user
		detailedUser.SuggestionPreferences = mapper.MapDBSuggestionPreferencesToDomain(suggestionPreferences)
		detailedUser.Links = mapper.MapDBLinksToDomain(links)
		items = append(items, &detailedUser)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
