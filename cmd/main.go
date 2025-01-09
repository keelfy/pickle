package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"

	// autoload .env file
	_ "github.com/joho/godotenv/autoload"
	"github.com/ory/graceful"
	"github.com/pickle.pw/monolith/config"
)

func main() {
	// Create a context with cancellation
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM)
	defer stop()

	// Initialize dependencies with Wire
	pickle, cleanup, err := InitializePickle(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize app: %v", err)
	}
	defer cleanup() // Ensure resources are cleaned up

	r, err := pickle.BuildAPI()
	if err != nil {
		log.Fatalf("Failed to build API: %v", err)
	}

	port := config.GetPort()

	server := graceful.WithDefaults(&http.Server{
		Addr:    fmt.Sprintf(":%s", port),
		Handler: r,
	})

	log.Printf("Starting the server on port %v", port)
	if err := graceful.Graceful(server.ListenAndServe, server.Shutdown); err != nil {
		log.Fatalln("Failed to gracefully shutdown")
	}
	log.Println("Server was shutdown gracefully")
}
