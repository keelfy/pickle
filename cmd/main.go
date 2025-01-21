package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"os/signal"
	"syscall"

	// autoload .env file
	_ "github.com/joho/godotenv/autoload"
	"github.com/ory/graceful"
	_ "github.com/pickle.pw/monolith/docs"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
)

func main() {
	// Create a context with cancellation
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM)
	defer stop()

	logger.PrepareLogger()

	// Initialize dependencies with Wire
	api, cleanup, err := InitializeAPI(ctx)
	if err != nil {
		logger.Fatalf(ctx, "Failed to initialize app: %v", err)
	}
	defer cleanup() // Ensure resources are cleaned up

	r, err := api.BuildAPI(ctx)
	if err != nil {
		logger.Fatalf(ctx, "Failed to build API: %v", err)
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

	logger.Infof(ctx, "Starting the server on port %v", port)
	if err := graceful.Graceful(server.ListenAndServe, server.Shutdown); err != nil {
		logger.Fatal(ctx, "Failed to gracefully shutdown")
	}
	logger.Infof(ctx, "Server was shutdown gracefully")
}
