package storage

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/index"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	esTypes "github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/types"
)

type ElasticClient interface {
	Ping(ctx context.Context) error
	CreateOrUpdateIndex(ctx context.Context, indexName string, query []byte) error
	IndexDocument(ctx context.Context, indexName, id string, document any) (*index.Response, error)
	Search(ctx context.Context, indexName string, query *esTypes.Query, pagination *types.Pagination) (*search.Response, error)
	IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category db.ContentCategory) error
	SearchContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error)
	DeleteContentNoteByID(ctx context.Context, indexName string, contentID uuid.UUID) error
	DeleteContent(ctx context.Context, contentID uuid.UUID, category db.ContentCategory) error
}

type elasticClient struct {
	client *elasticsearch.TypedClient
}

func NewElasticClient() (ElasticClient, error) {
	ctx := context.Background()
	logger.Infof(ctx, "%v Elasticsearch %v", strings.Repeat("~", 11), strings.Repeat("~", 11))

	client, err := elasticsearch.NewTypedClient(elasticsearch.Config{
		Addresses: config.GetElasticsearchUrls(),
		Username:  config.GetElasticsearchUsername(),
		Password:  config.GetElasticsearchPassword(),
	})
	if err != nil {
		return nil, fmt.Errorf("Error creating the client: %s", err)
	}

	storage := &elasticClient{
		client: client,
	}

	storage.logElasticsearchClusterInfo()
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return storage, nil
}

func (storage *elasticClient) logElasticsearchClusterInfo() {
	ctx := context.Background()
	info, err := storage.client.Info().Do(ctx)
	if err != nil {
		logger.Fatalf(ctx, "Error getting response: %s", err)
	}

	// Print client and server version numbers.
	logger.Infof(ctx, "Client: %s", elasticsearch.Version)
	logger.Infof(ctx, "Server: %s", info.Version.Int)
}

func (storage *elasticClient) Ping(ctx context.Context) error {
	_, err := storage.client.Info().Do(ctx)
	if err != nil {
		logger.Errorf(ctx, "[ELASTIC] Error pinging Elasticsearch: %v", err)
		return err
	}
	return nil
}

func (storage *elasticClient) CreateOrUpdateIndex(ctx context.Context, indexName string, query []byte) error {
	// Check if index exists
	if exists, err := storage.indexExists(ctx, indexName); exists {
		err := storage.putMapping(ctx, indexName, query)
		if err != nil {
			return err
		}
		logger.Infof(ctx, "Mapping for index %s updated successfully.", indexName)
	} else if err == nil {
		err := storage.createIndex(ctx, indexName, query)
		if err != nil {
			return fmt.Errorf("error creating index %s: %w", indexName, err)
		}
		logger.Infof(ctx, "Index %s created successfully.", indexName)
	} else {
		return fmt.Errorf("error checking if index exists: %w", err)
	}

	return nil
}

func (storage *elasticClient) indexExists(ctx context.Context, indexName string) (bool, error) {
	return storage.client.Indices.Exists(indexName).IsSuccess(ctx)
}

func (storage *elasticClient) putMapping(ctx context.Context, indexName string, query []byte) error {
	mappingReader := bytes.NewReader(query)
	_, err := storage.client.Indices.PutMapping(indexName).Raw(mappingReader).Do(ctx)
	if err != nil {
		return fmt.Errorf("error updating mapping: %w", err)
	}
	return nil
}

func (storage *elasticClient) createIndex(ctx context.Context, indexName string, query []byte) error {
	mappingReader := bytes.NewReader(query)
	_, err := storage.client.Indices.Create(indexName).Raw(mappingReader).Do(ctx)
	if err != nil {
		return fmt.Errorf("error creating index %s: %w", indexName, err)
	}
	return nil
}

func (storage *elasticClient) IndexDocument(ctx context.Context, indexName, id string, document any) (*index.Response, error) {
	response, err := storage.client.Index(indexName).Id(id).Document(document).Do(ctx)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error indexing document: %v", err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] Document indexed: %s", response.Result)
	return response, nil
}

func (storage *elasticClient) Search(ctx context.Context, indexName string, query *esTypes.Query, pagination *types.Pagination) (*search.Response, error) {
	response, err := storage.client.Search().
		Index(indexName).
		Request(&search.Request{
			From:  &pagination.From,
			Size:  &pagination.Size,
			Query: query,
		}).
		Do(ctx)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error searching documents: %v", err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] Documents found: %d", response.Hits.Total.Value)
	return response, nil
}

func (service *elasticClient) IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category db.ContentCategory) error {
	document := &types.EsContent{
		ID:       id,
		Name:     name,
		UserID:   userId,
		Category: category,
	}
	docID := fmt.Sprintf("%s-%s", category, id.String())
	_, err := service.IndexDocument(ctx, "content", docID, document)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during content indexing", err)
	}
	return nil
}

func (storage *elasticClient) SearchContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error) {
	esQuery := &esTypes.Query{
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
	}

	response, err := storage.Search(ctx, "content", esQuery, pagination)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error searching content: %v", err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] Content found: %d", response.Hits.Total.Value)
	return response, nil
}

func (storage *elasticClient) DeleteContentNoteByID(ctx context.Context, indexName string, contentID uuid.UUID) error {
	_, err := storage.client.Delete(indexName, contentID.String()).Do(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error deleting content document", err)
	}
	logger.Debugf(ctx, "[ELASTIC] Content deleted: %s", contentID)
	return nil
}

func (storage *elasticClient) DeleteContent(ctx context.Context, contentID uuid.UUID, category db.ContentCategory) error {
	docID := fmt.Sprintf("%s-%s", category, contentID.String())
	_, err := storage.client.Delete("content", docID).Do(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error deleting content document", err)
	}
	logger.Debugf(ctx, "[ELASTIC] Content deleted: %s", contentID)
	return nil
}
