package services

import (
	"context"
	"encoding/json"
	"slices"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	cerrors "github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/models/responses"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
)

type ContentService interface {
	SearchContent(ctx context.Context, category db.ContentCategory, query string, userID uuid.UUID, locale string, pagination *types.Pagination) (*responses.ContentSearchRes, error)
	GetLocalizedContentByID(ctx context.Context, category db.ContentCategory, id uuid.UUID, coverSize, locale string) (responses.ContentRes, error)
}

type contentService struct {
	sqlDB         storage.RelationalStorage
	elastic       storage.ElasticStorage
	posterService PosterService
	gameService   GameService
	movieService  MovieService
}

func NewContentService(
	sqlDB storage.RelationalStorage,
	elastic storage.ElasticStorage,
	posterService PosterService,
	gameService GameService,
	movieService MovieService,
) ContentService {
	return &contentService{
		sqlDB:         sqlDB,
		elastic:       elastic,
		posterService: posterService,
		gameService:   gameService,
		movieService:  movieService,
	}
}

func (s *contentService) getTitleFromElasticContent(ctx context.Context, dbSource models.BasicElasticContent, locale string) (string, error) {
	switch locale {
	case "en":
		return dbSource.EnglishName, nil
	case "ru":
		return dbSource.RussianName, nil
	case "de":
		return dbSource.GermanName, nil
	case "es":
		return dbSource.SpanishName, nil
	default:
		return "", cerrors.NewBadRequestError("Unsupported locale", nil)
	}
}

func (s *contentService) SearchContent(ctx context.Context, category db.ContentCategory, query string, userID uuid.UUID, locale string, pagination *types.Pagination) (*responses.ContentSearchRes, error) {
	searchResponse, err := s.elastic.SearchIndexedContent(ctx, category, query, pagination)

	if err != nil {
		logger.Errorf(ctx, "err searching content: %v", err)
		return nil, cerrors.NewInternalServerError("Error occurred during content search", err)
	}

	notedContentIDs := []uuid.UUID{}

	if userID != uuid.Nil {
		switch category {
		case db.ContentCategoryGames:
			notedContentIDs, err = s.sqlDB.Queries().FindGameNoteContentIDsByUserID(ctx, userID)
		case db.ContentCategoryMovies:
			notedContentIDs, err = s.sqlDB.Queries().FindMovieNoteContentIDsByUserID(ctx, userID)
		default:
			return nil, cerrors.NewInternalServerError("Unsupported content category", nil)
		}

		if err != nil {
			logger.Errorf(ctx, "err finding noted content IDs: %v", err)
			return nil, cerrors.NewInternalServerError("Error occurred during noted content search", err)
		}
	}

	searchHits := searchResponse.Hits.Hits
	results := []types.SearchHitRes[responses.ContentSearchResultRes]{}

	for _, searchHit := range searchHits {
		if searchHit.Id_ == nil {
			logger.Warnf(ctx, "search hit ID is nil")
			continue
		}

		// parse content ID from search hit ID
		contentID, err := uuid.Parse(*searchHit.Id_)
		if err != nil {
			logger.Warnf(ctx, "err parsing search hit ID: %v", err)
			continue
		}

		// parse content data from search hit source
		rawSource := searchHit.Source_
		var dbSource models.BasicElasticContent
		if err := json.Unmarshal(rawSource, &dbSource); err != nil {
			return nil, errors.NewInternalServerError("Error occurred during IGDB game search", err)
		}

		// prepare source response
		sourceRes := responses.ContentSearchResultRes{}

		// localize title
		title, err := s.getTitleFromElasticContent(ctx, dbSource, locale)
		if err != nil {
			logger.Warnf(ctx, "err localizing title: %v", err)
			title = dbSource.EnglishName
		}
		sourceRes.Title = title

		// construct thumbnail URL
		if dbSource.ImageKey != nil {
			thumbnailURL, err := s.posterService.GetContentThumbnailImageURL(ctx, "sm", *dbSource.ImageKey, dbSource.ImageKeyType)
			if err != nil {
				logger.Warnf(ctx, "err constructing thumbnail URL: %v", err)
			} else {
				sourceRes.ThumbnailURL = &thumbnailURL
			}
		}

		// check if content is noted in the profile
		if len(notedContentIDs) > 0 {
			sourceRes.IsNoted = slices.Contains(notedContentIDs, contentID)
		}

		hitScore := 0.0
		if searchHit.Score_ != nil {
			hitScore = float64(*searchHit.Score_)
		}

		// construct hit response
		hitRes := types.SearchHitRes[responses.ContentSearchResultRes]{
			ID:     contentID.String(),
			Score:  hitScore,
			Source: sourceRes,
		}
		results = append(results, hitRes)
	}

	// construct paginated response
	res := &responses.ContentSearchRes{
		Content:       results,
		Page:          pagination.Page,
		Size:          pagination.Size,
		TotalPages:    searchResponse.Hits.Total.Value / int64(pagination.Size),
		TotalElements: searchResponse.Hits.Total.Value,
	}

	return res, nil
}

func (s *contentService) GetLocalizedContentByID(ctx context.Context, category db.ContentCategory, id uuid.UUID, coverSize, locale string) (responses.ContentRes, error) {
	var (
		content models.Content
		err     error
	)

	switch category {
	case db.ContentCategoryGames:
		content, err = s.gameService.GetGameByIDWithLocalization(ctx, id, locale)
	case db.ContentCategoryMovies:
		content, err = s.movieService.GetMovieByIDWithLocalization(ctx, id, locale)
	default:
		return nil, cerrors.NewInternalServerError("unsupported content category", nil)
	}

	if err != nil {
		return nil, err
	}

	var res responses.ContentRes

	var coverURL *string
	if content.GetCoverKey() != nil && content.GetCoverKeyType().Valid {
		url, err := s.posterService.GetCoverImageURL(ctx, coverSize, *content.GetCoverKey(), content.GetCoverKeyType().ImageKeyType)
		if err != nil {
			return nil, cerrors.NewInternalServerError("failed to get cover image URL", err)
		}
		coverURL = &url
	}

	basicRes := responses.BasicContentRes{
		ID:         content.GetID(),
		ExternalID: content.GetExternalID(),
		Title:      content.GetTitle(),
		CoverURL:   coverURL,
		SourceURL:  content.GetSourceURL(),
		SourceType: content.GetSourceType(),
	}

	switch content := content.(type) {
	case *models.Game:
		res = &responses.GameRes{
			BasicContentRes: basicRes,
			ReleaseDate:     content.ReleaseDate,
			Websites:        content.Websites,
		}
	case *models.Movie:
		res = &responses.MovieRes{
			BasicContentRes: basicRes,
			ReleaseDate:     content.ReleaseDate,
			Websites:        content.Websites,
		}
	}

	return res, nil
}
