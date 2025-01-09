package services

import (
	"context"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	esTypes "github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/types"
)

type Content struct {
	esClient *elasticsearch.TypedClient
}

func NewContentService(esClient *elasticsearch.TypedClient) *Content {
	return &Content{
		esClient: esClient,
	}
}

func (service *Content) IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category int16) error {
	document := &types.EsContent{
		ID:       id,
		Name:     name,
		UserID:   userId,
		Category: types.Category_Game,
	}
	_, err := service.esClient.Index("content").Document(document).Do(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during content indexing", err)
	}
	return nil
}

func (service *Content) SearchContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error) {
	content, err := service.esClient.Search().
		Index("content").
		Request(&search.Request{
			From: &pagination.From,
			Size: &pagination.Size,
			Query: &esTypes.Query{
				Bool: &esTypes.BoolQuery{
					Filter: []esTypes.Query{
						{
							Match: map[string]esTypes.MatchQuery{
								"user_id": {
									Query: userId.String(),
								},
							},
						},
					},
					Must: []esTypes.Query{
						{
							Match: map[string]esTypes.MatchQuery{
								"name": {
									Query:     query,
									Fuzziness: "AUTO",
								},
							},
						},
					},
				},
			},
		}).
		Do(ctx)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during content search", err)
	}
	return content, nil
}
