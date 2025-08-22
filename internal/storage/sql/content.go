package sql

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/domain"
)

func getContentTableNameByCategory(category domain.ContentCategory) (string, error) {
	switch category {
	case domain.ContentCategoryGames:
		return "games", nil
	case domain.ContentCategoryMovies:
		return "movies", nil
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
}

func getContentLocalizationTableNameByCategory(category domain.ContentCategory) (string, error) {
	switch category {
	case domain.ContentCategoryGames:
		return "game_localizations", nil
	case domain.ContentCategoryMovies:
		return "movie_localizations", nil
	}
	return "", fmt.Errorf("invalid content category: %s", category)
}

func getContentColumnsToSelect(category domain.ContentCategory) (string, error) {
	columns := []string{}
	switch category {
	case domain.ContentCategoryGames:
		columns = append(columns, "content.release_date")
	case domain.ContentCategoryMovies:
		columns = append(columns, "content.release_date")
	default:
		return "", fmt.Errorf("invalid content category: %s", category)
	}
	return strings.Join(columns, ", ") + ",", nil
}

func scanContent(row pgx.Row, category domain.ContentCategory) (domain.IContent, error) {
	switch category {
	case domain.ContentCategoryGames:
		var base domain.ContentBase
		var game domain.Game
		err := row.Scan(
			&base.ID,
			&game.ReleaseDate,
			&base.CoverKey,
			&base.CoverKeyType,
			&base.Title,
		)
		game.Category = domain.ContentCategoryGames
		return &game, err
	case domain.ContentCategoryMovies:
		var base domain.ContentBase
		var movie domain.Movie
		err := row.Scan(
			&base.ID,
			&movie.ReleaseDate,
			&base.CoverKey,
			&base.CoverKeyType,
			&base.Title,
		)
		movie.Category = domain.ContentCategoryMovies
		return &movie, err
	}
	return nil, fmt.Errorf("invalid content category: %s", category)
}

const findContentByID = `
SELECT 
	content.id, 
	%s
	content.cover_key, 
	content.cover_key_type, 
	COALESCE(localizations.title, 'Untitled') AS title
FROM %s content
LEFT JOIN %s localizations ON content.id = localizations.content_id
	AND localizations.locale = $1::text
WHERE content.id = $2::uuid
`

func (q *queries) FindContentByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory, locale string) (domain.IContent, error) {
	contentColumns, err := getContentColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	tableName, err := getContentTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	localizationTableName, err := getContentLocalizationTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findContentByID, contentColumns, tableName, localizationTableName)
	row := q.tx.QueryRow(ctx, query, locale, id)
	return scanContent(row, category)
}

func scanDetailedContent(row pgx.Row, category domain.ContentCategory) (domain.IDetailedContent, error) {
	switch category {
	case domain.ContentCategoryGames:
		var base domain.ContentBase
		var game domain.Game
		var detailedContent domain.DetailedContentBase
		err := row.Scan(
			&base.ID,
			&game.ReleaseDate,
			&base.CoverKey,
			&base.CoverKeyType,
			&base.Title,
			&detailedContent.SourceType,
			&detailedContent.SourceURL,
			&detailedContent.Websites,
		)
		game.ContentBase = &base
		base.Category = domain.ContentCategoryGames
		return &domain.DetailedGame{
			DetailedContentBase: &detailedContent,
			Game:                &game,
		}, err
	case domain.ContentCategoryMovies:
		var base domain.ContentBase
		var movie domain.Movie
		var detailedContent domain.DetailedContentBase
		err := row.Scan(
			&base.ID,
			&movie.ReleaseDate,
			&base.CoverKey,
			&base.CoverKeyType,
			&base.Title,
			&detailedContent.SourceType,
			&detailedContent.SourceURL,
			&detailedContent.Websites,
		)
		movie.ContentBase = &base
		movie.Category = domain.ContentCategoryMovies
		return &domain.DetailedMovie{
			DetailedContentBase: &detailedContent,
			Movie:               &movie,
		}, err
	}
	return nil, fmt.Errorf("invalid content category: %s", category)
}

const findDetailedContentByID = `
SELECT 
	content.id, 
	%s
	content.cover_key, 
	content.cover_key_type, 
	COALESCE(localizations.title, 'Untitled') AS title,
	content.source_type,
	content.source_url,
	content.websites
FROM %s content
LEFT JOIN %s localizations ON content.id = localizations.content_id
	AND localizations.locale = $1::text
WHERE content.id = $2::uuid
`

func (q *queries) FindDetailedContentByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory, locale string) (domain.IDetailedContent, error) {
	contentColumns, err := getContentColumnsToSelect(category)
	if err != nil {
		return nil, err
	}

	tableName, err := getContentTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	localizationTableName, err := getContentLocalizationTableNameByCategory(category)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(findDetailedContentByID, contentColumns, tableName, localizationTableName)
	row := q.tx.QueryRow(ctx, query, locale, id)
	return scanDetailedContent(row, category)
}
