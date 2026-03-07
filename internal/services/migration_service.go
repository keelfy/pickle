package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/storage"
	"go.uber.org/zap"
)

type MigrationService interface {
	ApplyElasticMigration(ctx context.Context, migration MigrationFile) error
	LoadElasticMigrations(folder string) ([]MigrationFile, error)
}

type migrationService struct {
	sqlDb   storage.RelationalStorage
	elastic storage.ElasticStorage
	logger  *zap.SugaredLogger
}

func NewMigrationService(sqlDb storage.RelationalStorage, elastic storage.ElasticStorage, zapLogger *zap.SugaredLogger) MigrationService {
	return &migrationService{
		sqlDb:   sqlDb,
		elastic: elastic, logger: zapLogger,
	}
}

type MigrationFile struct {
	ID    string          `json:"id"`
	Index string          `json:"index"`
	Query json.RawMessage `json:"query"`
}

func (service *migrationService) ApplyElasticMigration(ctx context.Context, migration MigrationFile) error {
	// Check if migration has already been applied
	mlog, err := service.sqlDb.Queries().FindElasticsearchMigrationByName(ctx, migration.ID)
	if err != pgx.ErrNoRows && err != nil {
		return fmt.Errorf("error checking if migration has already been applied: %w", err)
	}

	if mlog.Name == migration.ID {
		service.logger.Warnf("Migration %s has already been applied.", migration.ID)
		return nil
	}

	err = service.elastic.CreateOrUpdateIndex(ctx, migration.Index, migration.Query)
	if err != nil {
		return fmt.Errorf("error creating or updating index: %w", err)
	}

	err = service.sqlDb.Queries().InsertElasticsearchMigration(context.Background(), migration.ID)
	if err != nil {
		return fmt.Errorf("error inserting migration log to database: %w", err)
	}
	return nil
}

func (service *migrationService) LoadElasticMigrations(folder string) ([]MigrationFile, error) {
	var migrations []MigrationFile
	err := filepath.Walk(folder, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			data, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			if !strings.HasSuffix(info.Name(), ".json") {
				return nil
			}

			var migration MigrationFile
			if err := json.Unmarshal(data, &migration); err != nil {
				return err
			}
			migrations = append(migrations, migration)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return migrations, nil
}
