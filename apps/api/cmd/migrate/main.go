package main

import (
	"context"
	"log"

	_ "github.com/joho/godotenv/autoload"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"go.uber.org/zap"
)

func main() {
	ctx := context.Background()
	zapLogger, err := logger.NewLogger()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer func() {
		_ = zapLogger.Desugar().Sync()
	}()
	zap.ReplaceGlobals(zapLogger.Desugar())

	relationalStorage, cleanup, err := storage.NewRelationalStorage(ctx, zapLogger)
	if err != nil {
		zapLogger.Fatalf("Failed to initialize relational storage: %v", err)
	}
	defer cleanup()

	elasticStorage, err := storage.NewElasticStorage(zapLogger)
	if err != nil {
		zapLogger.Fatalf("Failed to initialize elastic storage: %v", err)
	}

	migrationService := services.NewMigrationService(relationalStorage, elasticStorage, zapLogger)
	migrations, err := migrationService.LoadElasticMigrations("./db/elasticsearch/migration")
	if err != nil {
		zapLogger.Fatalf("Failed to load elasticsearch migrations: %v", err)
	}

	for _, migration := range migrations {
		if err := migrationService.ApplyElasticMigration(ctx, migration); err != nil {
			zapLogger.Fatalf("Failed to apply elasticsearch migration %s: %v", migration.ID, err)
		}
	}

	zapLogger.Infof("Applied %d elasticsearch migrations", len(migrations))
}
