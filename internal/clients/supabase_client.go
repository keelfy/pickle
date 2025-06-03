package clients

import (
	"context"
	"strings"

	supa "github.com/nedpals/supabase-go"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
)

type SupabaseClient interface {
}

type supabaseClient struct {
	client *supa.Client
}

func NewSupabaseClient(ctx context.Context) (SupabaseClient, error) {
	logger.Infof(ctx, "%v Supabase %v", strings.Repeat("~", 12), strings.Repeat("~", 13))

	url := config.GetSupabaseUrl()
	serviceKey := config.GetSupabaseKey()

	client := supa.CreateClient(url, serviceKey)
	wrapper := &supabaseClient{
		client: client,
	}

	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return wrapper, nil
}
