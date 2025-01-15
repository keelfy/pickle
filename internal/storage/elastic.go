package storage

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/pickle.pw/monolith/config"
)

func InitElasticsearchClient() (*elasticsearch.TypedClient, error) {
	log.Printf("%v Elasticsearch %v\n", strings.Repeat("~", 11), strings.Repeat("~", 11))

	es, err := elasticsearch.NewTypedClient(elasticsearch.Config{
		Addresses: config.GetElasticsearchUrls(),
	})
	if err != nil {
		return nil, fmt.Errorf("Error creating the client: %s", err)
	}

	logElasticsearchClusterInfo(es)
	log.Println(strings.Repeat("~", 37))
	return es, nil
}

func logElasticsearchClusterInfo(es *elasticsearch.TypedClient) {
	info, err := es.Info().Do(context.Background())
	if err != nil {
		log.Fatalf("Error getting response: %s", err)
	}

	// Print client and server version numbers.
	log.Printf("Client: %s\n", elasticsearch.Version)
	log.Printf("Server: %s\n", info.Version.Int)
}
