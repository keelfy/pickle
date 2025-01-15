package storage

import (
	"context"
	"log"
	"strings"

	"github.com/pickle.pw/monolith/config"
	"github.com/redis/go-redis/v9"
)

func InitRedisClient(ctx context.Context) (*redis.Client, error) {
	log.Printf("%v Redis %v\n", strings.Repeat("~", 15), strings.Repeat("~", 15))
	url := config.GetRedisURL()
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(opts)
	log.Println("Client created")
	log.Println(strings.Repeat("~", 37))
	return client, nil
}
