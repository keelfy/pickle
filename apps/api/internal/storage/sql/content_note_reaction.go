package sql

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

func getContentNoteReactionsTableName(category domain.ContentCategory) (string, error) {
	switch category {
	case domain.ContentCategoryGames:
		return "game_note_reactions", nil
	case domain.ContentCategoryMovies:
		return "movie_note_reactions", nil
	default:
		return "", errors.New("invalid content category")
	}
}

const findReactionsByContentNoteIDsInAndRequesterUserID = `
SELECT cnr.content_note_id,
	cnr.emote_id,
	cnr.source,
	COUNT(DISTINCT cnr.user_id) AS count,
	EXISTS(
			SELECT 1
			FROM %s r2
			WHERE r2.content_note_id = cnr.content_note_id
				AND r2.user_id = $1::uuid
				AND r2.emote_id = cnr.emote_id
				AND r2.source = cnr.source
	) AS reacted_by_user
FROM %s cnr
WHERE cnr.content_note_id = ANY($2::uuid [])
GROUP BY cnr.content_note_id,
	cnr.emote_id,
	cnr.source
ORDER BY count DESC
`

func (q *queries) FindReactionsByContentNoteIDsInAndRequesterUserID(ctx context.Context, category domain.ContentCategory, contentNoteIDs uuid.UUIDs, requesterUserID *uuid.UUID) ([]*domain.ContentNoteReactionStack, error) {
	tableName, err := getContentNoteReactionsTableName(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findReactionsByContentNoteIDsInAndRequesterUserID, tableName, tableName)
	rows, err := q.tx.Query(ctx, query, requesterUserID, contentNoteIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*domain.ContentNoteReactionStack{}
	for rows.Next() {
		var reactionStack domain.ContentNoteReactionStack
		if err := rows.Scan(
			&reactionStack.ContentNoteID,
			&reactionStack.EmoteID,
			&reactionStack.Source,
			&reactionStack.Count,
			&reactionStack.UserReacted,
		); err != nil {
			return nil, err
		}
		items = append(items, &reactionStack)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const countReactionsByContentNoteIDAndUserID = `
SELECT COUNT(*)
FROM %s
WHERE content_note_id = $1::uuid
    AND user_id = $2::uuid
`

func (q *queries) CountReactionsByContentNoteIDAndUserID(ctx context.Context, category domain.ContentCategory, contentNoteID uuid.UUID, userID uuid.UUID) (int64, error) {
	tableName, err := getContentNoteReactionsTableName(category)
	if err != nil {
		return 0, err
	}

	query := fmt.Sprintf(countReactionsByContentNoteIDAndUserID, tableName)
	row := q.tx.QueryRow(ctx, query, contentNoteID, userID)
	var count int64
	err = row.Scan(&count)
	return count, err
}

const insertContentNoteReaction = `
INSERT INTO %s (
	content_note_id,
	emote_id,
	source,
	user_id,
	created_by
)
VALUES (
	$1::uuid,
	$2::text,
	$3::reaction_source,
	$4::uuid,
	$4::uuid
)
`

type InsertContentNoteReactionParams struct {
	ContentNoteID uuid.UUID             `json:"content_note_id"`
	EmoteID       string                `json:"emote_id"`
	Source        domain.ReactionSource `json:"source"`
	CreatedBy     uuid.UUID             `json:"created_by"`
}

func (q *queries) InsertContentNoteReaction(ctx context.Context, category domain.ContentCategory, arg *InsertContentNoteReactionParams) error {
	tableName, err := getContentNoteReactionsTableName(category)
	if err != nil {
		return err
	}

	query := fmt.Sprintf(insertContentNoteReaction, tableName)
	_, err = q.tx.Exec(ctx, query,
		arg.ContentNoteID,
		arg.EmoteID,
		arg.Source,
		arg.CreatedBy,
	)
	return err
}

const deleteContentNoteReaction = `
DELETE FROM %s
WHERE content_note_id = $1::uuid
    AND user_id = $2::uuid
    AND emote_id = $3::text
    AND source = $4::reaction_source
`

type DeleteContentNoteReactionParams struct {
	ContentNoteID uuid.UUID             `json:"content_note_id"`
	UserID        uuid.UUID             `json:"user_id"`
	EmoteID       string                `json:"emote_id"`
	Source        domain.ReactionSource `json:"source"`
}

func (q *queries) DeleteContentNoteReaction(ctx context.Context, category domain.ContentCategory, arg *DeleteContentNoteReactionParams) error {
	tableName, err := getContentNoteReactionsTableName(category)
	if err != nil {
		return err
	}

	query := fmt.Sprintf(deleteContentNoteReaction, tableName)
	_, err = q.tx.Exec(ctx, query,
		arg.ContentNoteID,
		arg.UserID,
		arg.EmoteID,
		arg.Source,
	)
	return err
}
