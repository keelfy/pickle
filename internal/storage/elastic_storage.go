package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/index"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	esTypes "github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/fieldvaluefactormodifier"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/functionboostmode"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/functionscoremode"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/textquerytype"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/types"
)

type ElasticStorage interface {
	Ping(ctx context.Context) error
	CreateOrUpdateIndex(ctx context.Context, indexName string, query []byte) error
	IndexDocument(ctx context.Context, indexName, id string, document any) (*index.Response, error)
	BulkIndexDocuments(ctx context.Context, indexName string, requests []*BulkIndexRequest) error
	Search(ctx context.Context, indexName string, query *esTypes.Query, pagination *types.Pagination) (*search.Response, error)
	IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category db.ContentCategory) error
	SearchProfileContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error)
	SearchIndexedContent(ctx context.Context, category db.ContentCategory, query string, pagination *types.Pagination) (*search.Response, error)
	DeleteContentNoteByID(ctx context.Context, category db.ContentCategory, contentID uuid.UUID) error
	DeleteContent(ctx context.Context, contentID uuid.UUID, category db.ContentCategory) error
}

type elasticStorage struct {
	client *elasticsearch.TypedClient
}

func NewElasticStorage(ctx context.Context) (ElasticStorage, error) {
	logger.Infof(ctx, "%v Elasticsearch %v", strings.Repeat("~", 11), strings.Repeat("~", 11))

	client, err := elasticsearch.NewTypedClient(elasticsearch.Config{
		Addresses: config.GetElasticsearchUrls(),
		Username:  config.GetElasticsearchUsername(),
		Password:  config.GetElasticsearchPassword(),
	})
	if err != nil {
		return nil, fmt.Errorf("Error creating the client: %s", err)
	}

	storage := &elasticStorage{
		client: client,
	}

	// storage.logElasticsearchClusterInfo()
	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return storage, nil
}

func (storage *elasticStorage) logElasticsearchClusterInfo() {
	ctx := context.Background()
	info, err := storage.client.Info().Do(ctx)
	if err != nil {
		logger.Fatalf(ctx, "Error getting response: %s", err)
	}

	// Print client and server version numbers.
	logger.Infof(ctx, "Client: %s", elasticsearch.Version)
	logger.Infof(ctx, "Server: %s", info.Version.Int)
}

func (storage *elasticStorage) Ping(ctx context.Context) error {
	_, err := storage.client.Info().Do(ctx)
	if err != nil {
		logger.Errorf(ctx, "[ELASTIC] Error pinging Elasticsearch: %v", err)
		return err
	}
	return nil
}

func (storage *elasticStorage) CreateOrUpdateIndex(ctx context.Context, indexName string, query []byte) error {
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

func (storage *elasticStorage) indexExists(ctx context.Context, indexName string) (bool, error) {
	return storage.client.Indices.Exists(indexName).IsSuccess(ctx)
}

func (storage *elasticStorage) putMapping(ctx context.Context, indexName string, query []byte) error {
	mappingReader := bytes.NewReader(query)
	_, err := storage.client.Indices.PutMapping(indexName).Raw(mappingReader).Do(ctx)
	if err != nil {
		return fmt.Errorf("error updating mapping: %w", err)
	}
	return nil
}

func (storage *elasticStorage) createIndex(ctx context.Context, indexName string, query []byte) error {
	mappingReader := bytes.NewReader(query)
	_, err := storage.client.Indices.Create(indexName).Raw(mappingReader).Do(ctx)
	if err != nil {
		return fmt.Errorf("error creating index %s: %w", indexName, err)
	}
	return nil
}

func (storage *elasticStorage) IndexDocument(ctx context.Context, indexName, id string, document any) (*index.Response, error) {
	response, err := storage.client.Index(indexName).Id(id).Document(document).Do(ctx)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error indexing document: %v", err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] Document indexed: %s", response.Result)
	return response, nil
}

type BulkIndexRequest struct {
	ID  string
	Doc any
}

func (storage *elasticStorage) BulkIndexDocuments(ctx context.Context, indexName string, requests []*BulkIndexRequest) error {
	var rawReq strings.Builder
	for _, request := range requests {
		rawReq.WriteString(fmt.Sprintf("{\"index\": {\"_index\": \"%s\", \"_id\": \"%s\"}}\n", indexName, request.ID))

		jsonDoc, err := json.Marshal(request.Doc)
		if err != nil {
			return fmt.Errorf("error marshalling document: %w", err)
		}

		rawReq.Write(jsonDoc)
		rawReq.WriteString("\n")
	}

	response, err := storage.client.Bulk().Raw(strings.NewReader(rawReq.String())).Do(ctx)
	if err != nil {
		return fmt.Errorf("error bulk indexing documents: %w", err)
	}

	logger.Debugf(ctx, "[ELASTIC] Documents indexed: %d", len(response.Items))
	return nil
}

func (storage *elasticStorage) Search(ctx context.Context, indexName string, query *esTypes.Query, pagination *types.Pagination) (*search.Response, error) {
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

func (service *elasticStorage) IndexContent(ctx context.Context, id uuid.UUID, name string, userId uuid.UUID, category db.ContentCategory) error {
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

func (storage *elasticStorage) SearchProfileContent(ctx context.Context, query string, userId uuid.UUID, pagination *types.Pagination) (*search.Response, error) {
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

func (storage *elasticStorage) SearchIndexedContent(ctx context.Context, category db.ContentCategory, query string, pagination *types.Pagination) (*search.Response, error) {
	// Create a multi-match query for text search across different language fields
	textQuery := &esTypes.Query{
		MultiMatch: &esTypes.MultiMatchQuery{
			Query:     query,
			Fields:    []string{"name_en", "name_ru", "name_de", "name_es"},
			Fuzziness: "AUTO",
			Type:      &textquerytype.Bestfields,
		},
	}

	factor := esTypes.Float64(0.1)
	esQuery := &esTypes.Query{
		FunctionScore: &esTypes.FunctionScoreQuery{
			Query: textQuery,
			Functions: []esTypes.FunctionScore{
				{
					FieldValueFactor: &esTypes.FieldValueFactorScoreFunction{
						Field:    "popularity",
						Factor:   &factor,
						Modifier: &fieldvaluefactormodifier.Log1p,
					},
				},
			},
			ScoreMode: &functionscoremode.Sum,
			BoostMode: &functionboostmode.Multiply,
		},
	}

	var indexName string
	switch category {
	case db.ContentCategoryGames:
		indexName = "igdb_games"
	case db.ContentCategoryMovies:
		indexName = "tmdb_movies"
	}

	response, err := storage.Search(ctx, indexName, esQuery, pagination)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error searching %s: %v", category, err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] %s found: %d", category, response.Hits.Total.Value)
	return response, nil
}

func (storage *elasticStorage) DeleteContentNoteByID(ctx context.Context, category db.ContentCategory, contentID uuid.UUID) error {
	var indexName string
	switch category {
	case db.ContentCategoryGames:
		indexName = "game_notes"
	case db.ContentCategoryMovies:
		indexName = "movie_notes"
	default:
		return errors.NewInternalServerError("Invalid content category", nil)
	}

	_, err := storage.client.Delete(indexName, contentID.String()).Do(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error deleting content document", err)
	}
	logger.Debugf(ctx, "[ELASTIC] Content deleted: %s", contentID)
	return nil
}

func (storage *elasticStorage) DeleteContent(ctx context.Context, contentID uuid.UUID, category db.ContentCategory) error {
	docID := fmt.Sprintf("%s-%s", category, contentID.String())
	_, err := storage.client.Delete("content", docID).Do(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error deleting content document", err)
	}
	logger.Debugf(ctx, "[ELASTIC] Content deleted: %s", contentID)
	return nil
}
