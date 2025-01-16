package storage

import (
	"context"
	"fmt"
	"strings"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/supabase-community/supabase-go"
)

type SupabaseClient interface {
}

type supabaseClient struct {
	client *supabase.Client
}

func NewSupabaseClient(ctx context.Context) (SupabaseClient, error) {
	logger.Infof(ctx, "%v Supabase %v", strings.Repeat("~", 12), strings.Repeat("~", 13))

	url := config.GetSupabaseUrl()
	serviceKey := config.GetSupabaseKey()

	client, err := supabase.NewClient(url, serviceKey, nil)
	if err != nil {
		return nil, fmt.Errorf("cannot initialize supabase client: %v", err)
	}

	wrapper := &supabaseClient{
		client: client,
	}

	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return wrapper, nil
}
