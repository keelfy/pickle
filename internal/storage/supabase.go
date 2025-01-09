package storage

import (
	"fmt"
	"log"
	"strings"

	"github.com/pickle.pw/monolith/config"
	"github.com/supabase-community/supabase-go"
)

func InitSupabase() (*supabase.Client, error) {
	log.Printf("%v Supabase %v\n", strings.Repeat("~", 12), strings.Repeat("~", 13))

	url := config.GetSupabaseUrl()
	serviceKey := config.GetSupabaseKey()

	client, err := supabase.NewClient(url, serviceKey, nil)
	if err != nil {
		return nil, fmt.Errorf("cannot initialize supabase client", err)
	}

	log.Println(strings.Repeat("~", 37))
	return client, nil
}
