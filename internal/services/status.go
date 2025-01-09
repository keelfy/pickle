package services

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/supabase-community/supabase-go"
)

type Status struct {
	sqlDb    *storage.SQLDatabase
	esClient *elasticsearch.TypedClient
	sbClient *supabase.Client
	s3Client *s3.Client
}

func NewStatusService(sqlDb *storage.SQLDatabase, es *elasticsearch.TypedClient, sb *supabase.Client, s3Client *s3.Client) *Status {
	return &Status{
		sqlDb:    sqlDb,
		esClient: es,
		sbClient: sb,
		s3Client: s3Client,
	}
}

func (service *Status) GetApiStatus() error {
	return nil
}

func (service *Status) GetDatabaseStatus(ctx context.Context) error {
	err := service.sqlDb.Conn.Ping(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (service *Status) GetElasticsearchStatus(ctx context.Context) error {
	_, err := service.esClient.Info().Do(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (service *Status) GetS3Status() error {
	return nil
}

func (service *Status) GetSupabaseStatus() error {
	return nil
}
