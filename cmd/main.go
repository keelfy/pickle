package main

import (
	// autoload .env file
	_ "github.com/joho/godotenv/autoload"
	"github.com/pickle.pw/monolith/cmd/api"
	"github.com/pickle.pw/monolith/config"
)

func main() {
	port := config.GetPort()

	api.StartAPI(port)
}
