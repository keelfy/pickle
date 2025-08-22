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
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/logger"
)

type ElasticStorage interface {
	Ping(ctx context.Context) error
	CreateOrUpdateIndex(ctx context.Context, indexName string, query []byte) error
	IndexDocument(ctx context.Context, indexName, id string, document any) (*index.Response, error)
	BulkIndexDocuments(ctx context.Context, indexName string, requests []*BulkIndexRequest) error
	Search(ctx context.Context, indexName string, query *esTypes.Query, pagination *domain.Pagination) (*search.Response, error)
	SearchUserContent(ctx context.Context, query string, userID uuid.UUID, pagination *domain.Pagination, notedContentIDs []string) (*search.Response, error)
	SearchIndexedContent(ctx context.Context, category domain.ContentCategory, query string, pagination *domain.Pagination) (*search.Response, error)
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

var (
	IGDBGamesIndex  = "igdb_games"
	TMDBMoviesIndex = "tmdb_movies"
)

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

func (storage *elasticStorage) Search(ctx context.Context, indexName string, query *esTypes.Query, pagination *domain.Pagination) (*search.Response, error) {
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

func (storage *elasticStorage) createContentTextQuery(query string) esTypes.Query {
	return esTypes.Query{
		MultiMatch: &esTypes.MultiMatchQuery{
			Query:     query,
			Fields:    []string{"name_en", "name_ru", "name_de", "name_es"},
			Fuzziness: "AUTO",
			Type:      &textquerytype.Bestfields,
		},
	}
}

func (storage *elasticStorage) SearchUserContent(ctx context.Context, query string, userID uuid.UUID, pagination *domain.Pagination, notedContentIDs []string) (*search.Response, error) {
	textQuery := storage.createContentTextQuery(query)

	termsQuery := map[string]esTypes.TermsQueryField{
		"_id": esTypes.TermsQueryField(notedContentIDs),
	}

	esQuery := &esTypes.Query{
		Bool: &esTypes.BoolQuery{
			Must: []esTypes.Query{textQuery},
			Should: []esTypes.Query{
				{
					Bool: &esTypes.BoolQuery{
						Filter: []esTypes.Query{
							{
								Terms: &esTypes.TermsQuery{
									TermsQuery: termsQuery,
								},
							},
						},
					},
				},
			},
		},
	}

	indexes := strings.Join([]string{IGDBGamesIndex, TMDBMoviesIndex}, ",")
	response, err := storage.Search(ctx, indexes, esQuery, pagination)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error searching content: %v", err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] Content found: %d", response.Hits.Total.Value)
	return response, nil
}

func (storage *elasticStorage) SearchIndexedContent(ctx context.Context, category domain.ContentCategory, query string, pagination *domain.Pagination) (*search.Response, error) {
	// Create a multi-match query for text search across different language fields
	textQuery := storage.createContentTextQuery(query)

	factor := esTypes.Float64(0.1)
	esQuery := &esTypes.Query{
		FunctionScore: &esTypes.FunctionScoreQuery{
			Query: &textQuery,
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
			BoostMode: &functionboostmode.Avg,
		},
	}

	var indexName string
	switch category {
	case domain.ContentCategoryGames:
		indexName = IGDBGamesIndex
	case domain.ContentCategoryMovies:
		indexName = TMDBMoviesIndex
	}

	response, err := storage.Search(ctx, indexName, esQuery, pagination)
	if err != nil {
		logger.Debugf(ctx, "[ELASTIC] Error searching %s: %v", category, err)
		return nil, err
	}

	logger.Debugf(ctx, "[ELASTIC] %s found: %d", category, response.Hits.Total.Value)
	return response, nil
}
