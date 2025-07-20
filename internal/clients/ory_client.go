package clients

import (
	"context"
	"strings"

	ory "github.com/ory/client-go"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/logger"
)

type OryAPI interface {
	GetSession(ctx context.Context, cookies string) (*ory.Session, error)
	GetIdentity(ctx context.Context, identityID string) (*ory.Identity, error)
}

type oryAPI struct {
	client *ory.APIClient
}

func NewOryAPI(ctx context.Context) (OryAPI, error) {
	logger.Infof(ctx, "%v Ory %v", strings.Repeat("~", 12), strings.Repeat("~", 13))

	c := ory.NewConfiguration()
	c.Servers = ory.ServerConfigurations{
		{
			URL: config.GetOryUrl(),
		},
	}
	oryClient := ory.NewAPIClient(c)
	wrapper := &oryAPI{
		client: oryClient,
	}

	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return wrapper, nil
}

func (api *oryAPI) GetSession(ctx context.Context, cookies string) (*ory.Session, error) {
	session, _, err := api.client.FrontendAPI.ToSession(ctx).Cookie(cookies).Execute()
	return session, err
}

func (api *oryAPI) GetIdentity(ctx context.Context, identityID string) (*ory.Identity, error) {
	identity, _, err := api.client.IdentityAPI.GetIdentity(ctx, identityID).Execute()
	return identity, err
}
