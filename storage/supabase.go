package storage

import (
	"fmt"

	"github.com/pickle.pw/monolith/config"
	"github.com/supabase-community/supabase-go"
)

func InitSupabase() *supabase.Client {
	url := config.GetSupabaseUrl()
	serviceKey := config.GetSupabaseKey()

	client, err := supabase.NewClient(url, serviceKey, nil)
	if err != nil {
		fmt.Println("cannot initialize supabase client", err)
	}

	return client
}
