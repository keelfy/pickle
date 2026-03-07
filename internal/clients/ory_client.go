package clients

import (
	"context"

	ory "github.com/ory/client-go"
	"github.com/pickle.pw/monolith/internal/config"
	"go.uber.org/zap"
)

type OryAPI interface {
	GetSession(ctx context.Context, cookies string) (*ory.Session, error)
	GetIdentity(ctx context.Context, identityID string) (*ory.Identity, error)
}

type oryAPI struct {
	client *ory.APIClient
	logger *zap.SugaredLogger
}

func NewOryAPI(zapLogger *zap.SugaredLogger) OryAPI {
	c := ory.NewConfiguration()
	c.Servers = ory.ServerConfigurations{
		{
			URL: config.GetOryUrl(),
		},
	}
	oryClient := ory.NewAPIClient(c)
	wrapper := &oryAPI{
		client: oryClient,
		logger: zapLogger,
	}

	return wrapper
}

func (api *oryAPI) GetSession(ctx context.Context, cookies string) (*ory.Session, error) {
	session, _, err := api.client.FrontendAPI.ToSession(ctx).Cookie(cookies).Execute()
	return session, err
}

func (api *oryAPI) GetIdentity(ctx context.Context, identityID string) (*ory.Identity, error) {
	identity, _, err := api.client.IdentityAPI.GetIdentity(ctx, identityID).Execute()
	return identity, err
}
