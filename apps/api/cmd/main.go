package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	// autoload .env file
	_ "github.com/joho/godotenv/autoload"
	"github.com/ory/graceful"
	_ "github.com/pickle.pw/monolith/docs"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"go.uber.org/zap"
)

// @title Pickle API
// @version 1.0
// @description This is a Pickle server.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host api.pickle.pw
// @BasePath /v1
func main() {
	// Create a context with cancellation
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	zapLogger, err := logger.NewLogger()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer func() {
		_ = zapLogger.Desugar().Sync()
	}()
	zap.ReplaceGlobals(zapLogger.Desugar())

	// Initialize dependencies with Wire
	api, err := InitializeAPI(ctx)
	if err != nil {
		zapLogger.Fatalf("Failed to initialize app: %v", err)
	}
	// defer cleanup() // Ensure resources are cleaned up

	r, err := api.BuildAPI(ctx)
	if err != nil {
		zapLogger.Fatalf("Failed to build API: %v", err)
	}

	port := config.GetPort()

	server := graceful.WithDefaults(&http.Server{
		Addr:    fmt.Sprintf(":%s", port),
		Handler: r,
		// Enable HTTP/2
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
			// Optimize HTTP/2 performance
			NextProtos: []string{"h2", "http/1.1"},
		},
	})

	zapLogger.Infof("Starting the server on port %v", port)
	if err := graceful.Graceful(server.ListenAndServe, server.Shutdown); err != nil {
		zapLogger.Fatal("Failed to gracefully shutdown")
	}
	zapLogger.Info("Server was shutdown gracefully")
}
