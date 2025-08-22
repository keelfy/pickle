package services

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/mapper"
	"github.com/pickle.pw/monolith/internal/middleware"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/utils"
)

type ContentService interface {
	GetContentByID(ctx context.Context, category domain.ContentCategory, id uuid.UUID) (domain.IContent, error)
	GetDetailedContentByID(ctx context.Context, category domain.ContentCategory, id uuid.UUID) (domain.IDetailedContent, error)
	GetContentCoverURL(ctx context.Context, content domain.IContent, coverSize domain.CoverSize) *string
	GetContentCoverURLsAsync(ctx context.Context, contents []domain.IContent, coverSize domain.CoverSize) (map[uuid.UUID]*string, error)
	SearchContent(ctx context.Context, cmd *commands.SearchContentCommand) (*commands.SearchContentResult, error)
	SearchUserContent(ctx context.Context, cmd *commands.SearchUserContentCommand) (*commands.SearchUserContentResult, error)
}

type contentService struct {
	sqlDB         storage.RelationalStorage
	elastic       storage.ElasticStorage
	posterService PosterService
}

func NewContentService(
	sqlDB storage.RelationalStorage,
	elastic storage.ElasticStorage,
	posterService PosterService,
) ContentService {
	return &contentService{
		sqlDB:         sqlDB,
		elastic:       elastic,
		posterService: posterService,
	}
}

func (s *contentService) GetContentByID(ctx context.Context, category domain.ContentCategory, id uuid.UUID) (domain.IContent, error) {
	locale, ok := ctx.Value(middleware.LocaleCtxKey).(string)
	if !ok {
		return nil, utils.NewInternalServerError("locale not found in context", nil)
	}

	content, err := s.sqlDB.Queries().FindContentByID(ctx, id, category, locale)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to find content by ID", err)
	}
	return content, nil
}

func (s *contentService) GetDetailedContentByID(ctx context.Context, category domain.ContentCategory, id uuid.UUID) (domain.IDetailedContent, error) {
	locale, ok := ctx.Value(middleware.LocaleCtxKey).(string)
	if !ok {
		return nil, utils.NewInternalServerError("locale not found in context", nil)
	}

	content, err := s.sqlDB.Queries().FindDetailedContentByID(ctx, id, category, locale)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to find detailed content by ID", err)
	}
	return content, nil
}

func (s *contentService) getTitleFromElasticContent(ctx context.Context, dbSource domain.ElasticContent, locale string) (string, error) {
	switch locale {
	case utils.EnglishLocale:
		return dbSource.EnglishName, nil
	case utils.RussianLocale:
		return dbSource.RussianName, nil
	case utils.GermanLocale:
		return dbSource.GermanName, nil
	case utils.SpanishLocale:
		return dbSource.SpanishName, nil
	default:
		return "", utils.NewBadRequestError(fmt.Sprintf("Unsupported locale: %s", locale), nil)
	}
}

func (s *contentService) GetContentCoverURL(ctx context.Context, content domain.IContent, coverSize domain.CoverSize) *string {
	if content == nil {
		return nil
	}

	coverKey := content.GetCoverKey()
	coverKeyType := content.GetCoverKeyType()

	if coverKey == nil || coverKeyType == nil {
		return nil
	}

	url, err := s.posterService.GetCoverImageURL(ctx, coverSize, *coverKey, *coverKeyType)
	if err != nil {
		logger.Errorf(ctx, "failed to get content cover URL: %v", err)
		return nil
	}

	return &url
}

func (s *contentService) GetContentCoverURLsAsync(ctx context.Context, contents []domain.IContent, coverSize domain.CoverSize) (map[uuid.UUID]*string, error) {
	var wg sync.WaitGroup
	coverURLs := sync.Map{}

	wg.Add(len(contents))
	for _, entry := range contents {
		go func() {
			defer wg.Done()

			if entry == nil {
				return
			}

			url := s.GetContentCoverURL(ctx, entry, coverSize)
			coverURLs.Store(entry.GetID(), url)
		}()
	}

	wg.Wait()

	coverURLsMap := make(map[uuid.UUID]*string)
	coverURLs.Range(func(key, value any) bool {
		coverURLsMap[key.(uuid.UUID)] = value.(*string)
		return true
	})
	return coverURLsMap, nil
}

func (s *contentService) SearchContent(ctx context.Context, cmd *commands.SearchContentCommand) (*commands.SearchContentResult, error) {
	locale := utils.GetLocaleFromCtx(ctx)

	searchResponse, err := s.elastic.SearchIndexedContent(ctx, cmd.Category, cmd.Query, cmd.Pagination)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to search content", err)
	}

	searchHits := searchResponse.Hits.Hits
	results := []*domain.SearchHit[domain.IContent]{}

	for _, searchHit := range searchHits {
		if searchHit.Id_ == nil {
			logger.Warnf(ctx, "search hit ID is nil, skipping")
			continue
		}

		mediaID := *searchHit.Id_
		category, contentID, err := mapper.MapMediaIDToContentID(mediaID)
		if err != nil {
			logger.Warnf(ctx, "failed to parse search hit ID: %v", err)
			continue
		}

		rawSource := searchHit.Source_
		var dbSource domain.ElasticContent
		if err := json.Unmarshal(rawSource, &dbSource); err != nil {
			return nil, utils.NewInternalServerError("failed to unmarshal search hit source", err)
		}

		title, err := s.getTitleFromElasticContent(ctx, dbSource, locale)
		if err != nil {
			logger.Warnf(ctx, "failed to localize title: %v", err)
			title = dbSource.EnglishName
		}

		sourceRes := &domain.ContentBase{
			ID:           contentID,
			Title:        title,
			Category:     category,
			CoverKey:     dbSource.ImageKey,
			CoverKeyType: &dbSource.ImageKeyType,
		}

		hitScore := 0.0
		if searchHit.Score_ != nil {
			hitScore = float64(*searchHit.Score_)
		}

		hitRes := &domain.SearchHit[domain.IContent]{
			ID:     contentID.String(),
			Score:  hitScore,
			Source: sourceRes,
		}
		results = append(results, hitRes)
	}

	res := &commands.SearchContentResult{
		Content:       results,
		Page:          cmd.Pagination.Page,
		Size:          cmd.Pagination.Size,
		TotalPages:    searchResponse.Hits.Total.Value / int64(cmd.Pagination.Size),
		TotalElements: searchResponse.Hits.Total.Value,
	}
	return res, nil
}

func (s *contentService) SearchUserContent(ctx context.Context, cmd *commands.SearchUserContentCommand) (*commands.SearchUserContentResult, error) {
	locale := utils.GetLocaleFromCtx(ctx)

	userContentNotes, err := s.sqlDB.Queries().FindContentNoteIDsWithContentIDsByUserID(ctx, cmd.UserID)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to find user content notes", err)
	}

	notedContent := make(map[string]uuid.UUID, len(userContentNotes))
	notedContentIDs := make([]string, 0, len(userContentNotes))
	for _, note := range userContentNotes {
		mediaID := mapper.MapContentIDToMediaID(note.ContentID, note.Category)
		notedContent[mediaID] = note.NoteID
		notedContentIDs = append(notedContentIDs, mediaID)
	}

	searchResponse, err := s.elastic.SearchUserContent(ctx, cmd.Query, cmd.UserID, cmd.Pagination, notedContentIDs)
	if err != nil {
		return nil, utils.NewInternalServerError("failed to search user content", err)
	}

	searchHits := searchResponse.Hits.Hits
	results := []*domain.SearchHit[*domain.UserContent]{}

	for _, searchHit := range searchHits {
		if searchHit.Id_ == nil {
			logger.Warnf(ctx, "search hit ID is nil, skipping")
			continue
		}

		mediaID := *searchHit.Id_
		category, contentID, err := mapper.MapMediaIDToContentID(mediaID)
		if err != nil {
			logger.Warnf(ctx, "failed to parse search hit ID: %v", err)
			continue
		}

		rawSource := searchHit.Source_
		var dbSource domain.ElasticContent
		if err := json.Unmarshal(rawSource, &dbSource); err != nil {
			return nil, utils.NewInternalServerError("failed to unmarshal search hit source", err)
		}

		title, err := s.getTitleFromElasticContent(ctx, dbSource, locale)
		if err != nil {
			logger.Warnf(ctx, "failed to get title from elastic content: %v", err)
			title = dbSource.EnglishName
		}

		contentBase := &domain.ContentBase{
			ID:           contentID,
			Title:        title,
			Category:     category,
			CoverKey:     dbSource.ImageKey,
			CoverKeyType: &dbSource.ImageKeyType,
		}

		var noteID *uuid.UUID
		if id, ok := notedContent[mediaID]; ok {
			noteID = &id
		}

		content := &domain.UserContent{
			ContentBase: contentBase,
			NoteID:      noteID,
		}

		score := 0.0
		if searchHit.Score_ != nil {
			score = float64(*searchHit.Score_)
		}

		results = append(results, &domain.SearchHit[*domain.UserContent]{
			ID:     contentID.String(),
			Score:  score,
			Source: content,
		})
	}

	res := &commands.SearchUserContentResult{
		Content:       results,
		Page:          cmd.Pagination.Page,
		Size:          cmd.Pagination.Size,
		TotalPages:    searchResponse.Hits.Total.Value / int64(cmd.Pagination.Size),
		TotalElements: searchResponse.Hits.Total.Value,
	}
	return res, nil
}
