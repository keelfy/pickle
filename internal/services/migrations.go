package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/storage"
)

type MigrationFile struct {
	ID    string          `json:"id"`
	Index string          `json:"index"`
	Query json.RawMessage `json:"query"`
}

type Migrations struct {
	sqlDb    *storage.SQLDatabase
	esClient *elasticsearch.TypedClient
}

func NewMigrationsService(sqlDb *storage.SQLDatabase, es *elasticsearch.TypedClient) *Migrations {
	return &Migrations{
		sqlDb:    sqlDb,
		esClient: es,
	}
}

func (service *Migrations) ApplyMigration(migration MigrationFile) error {
	// Check if migration has already been applied
	mlog, err := service.sqlDb.Queries.FindElasticsearchMigrationByName(context.Background(), migration.ID)
	if err != pgx.ErrNoRows && err != nil {
		return fmt.Errorf("error checking if migration has already been applied: %w", err)
	}

	if mlog.Name == migration.ID {
		log.Printf("Migration %s has already been applied.", migration.ID)
		return nil
	}

	// Check if index exists
	mappingReader := bytes.NewReader(migration.Query)

	if exists, err := service.esClient.Indices.Exists(migration.Index).IsSuccess(context.Background()); exists {
		_, err := service.esClient.Indices.PutMapping(migration.Index).Raw(mappingReader).Do(context.Background())
		if err != nil {
			return fmt.Errorf("error updating mapping: %w", err)
		}
		log.Printf("Mapping for index %s updated successfully.", migration.Index)
	} else if err == nil {
		// Index does not exist, create it
		_, err := service.esClient.Indices.Create(migration.Index).Raw(mappingReader).Do(context.Background())
		if err != nil {
			return fmt.Errorf("error creating index %s: %w", migration.Index, err)
		}
		log.Printf("Index %s created successfully.", migration.Index)
	} else {
		return fmt.Errorf("error checking if index exists: %w", err)
	}

	err = service.sqlDb.Queries.InsertElasticsearchMigration(context.Background(), migration.ID)
	if err != nil {
		return fmt.Errorf("error inserting migration log to database: %w", err)
	}
	return nil
}

func (service *Migrations) LoadMigrations(folder string) ([]MigrationFile, error) {
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
