package main

import (
	"context"

	_ "github.com/joho/godotenv/autoload"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
)

func main() {
	ctx := context.Background()
	logger.PrepareLogger()

	relationalStorage, cleanup, err := storage.NewRelationalStorage(ctx)
	if err != nil {
		logger.Fatalf(ctx, "Failed to initialize relational storage: %v", err)
	}
	defer cleanup()

	elasticStorage, err := storage.NewElasticStorage(ctx)
	if err != nil {
		logger.Fatalf(ctx, "Failed to initialize elastic storage: %v", err)
	}

	migrationService := services.NewMigrationService(relationalStorage, elasticStorage)
	migrations, err := migrationService.LoadElasticMigrations("./db/elasticsearch/migration")
	if err != nil {
		logger.Fatalf(ctx, "Failed to load elasticsearch migrations: %v", err)
	}

	for _, migration := range migrations {
		if err := migrationService.ApplyElasticMigration(ctx, migration); err != nil {
			logger.Fatalf(ctx, "Failed to apply elasticsearch migration %s: %v", migration.ID, err)
		}
	}

	logger.Infof(ctx, "Applied %d elasticsearch migrations", len(migrations))
}
