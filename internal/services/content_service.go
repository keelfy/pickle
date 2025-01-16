package services

import (
	"context"

	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
)

type ContentService interface {
	IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category db.ContentCategory) error
	SearchContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error)
}

type contentService struct {
	elastic storage.ElasticClient
}

func NewContentService(elastic storage.ElasticClient) ContentService {
	return &contentService{
		elastic: elastic,
	}
}

func (service *contentService) IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category db.ContentCategory) error {
	document := &types.EsContent{
		ID:       id,
		Name:     name,
		UserID:   userId,
		Category: category,
	}
	_, err := service.elastic.IndexDocument(ctx, "content", document)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during content indexing", err)
	}
	return nil
}

func (service *contentService) SearchContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error) {
	response, err := service.elastic.SearchContent(ctx, query, userId, pagination)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during content search", err)
	}
	return response, nil
}
