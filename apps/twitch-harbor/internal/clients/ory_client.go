package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	ory "github.com/ory/client-go"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/model"
)

type OryAPI interface {
	GetSession(ctx context.Context, cookies string) (*ory.Session, error)
	GetIdentity(ctx context.Context, identityID string) (*ory.Identity, error)
	GetIdentityTwitchOIDC(ctx context.Context, identityID uuid.UUID) (*model.TwitchAuth, error)
}

type oryAPI struct {
	adminClient  *ory.APIClient
	publicClient *ory.APIClient
}

func NewOryAPI(ctx context.Context) (OryAPI, error) {
	logger.Infof(ctx, "%v Ory %v", strings.Repeat("~", 12), strings.Repeat("~", 13))

	adminURL := config.GetOryAdminUrl()
	publicURL := config.GetOryPublicUrl()
	logger.Infof(ctx, "Using ORY endpoints | admin: %s | public: %s", adminURL, publicURL)

	// Use separate configurations to avoid shared pointer mutation between clients
	adminCfg := ory.NewConfiguration()
	adminCfg.Servers = ory.ServerConfigurations{
		{
			URL: adminURL,
		},
	}
	adminClient := ory.NewAPIClient(adminCfg)

	publicCfg := ory.NewConfiguration()
	publicCfg.Servers = ory.ServerConfigurations{
		{
			URL: publicURL,
		},
	}
	publicClient := ory.NewAPIClient(publicCfg)

	wrapper := &oryAPI{
		adminClient:  adminClient,
		publicClient: publicClient,
	}

	logger.Infof(ctx, "%s", strings.Repeat("~", 37))
	return wrapper, nil
}

type OidcProviderConfig struct {
	InitialIDToken      string `json:"initial_id_token"`
	InitialAccessToken  string `json:"initial_access_token"`
	InitialRefreshToken string `json:"initial_refresh_token"`
	Subject             string `json:"subject"`
	Provider            string `json:"provider"`
	Organization        string `json:"organization"`
}

func (api *oryAPI) GetSession(ctx context.Context, cookies string) (*ory.Session, error) {
	session, _, err := api.publicClient.FrontendAPI.ToSession(ctx).Cookie(cookies).Execute()
	return session, err
}

func (api *oryAPI) GetIdentity(ctx context.Context, identityID string) (*ory.Identity, error) {
	identity, _, err := api.adminClient.IdentityAPI.GetIdentity(ctx, identityID).Execute()
	return identity, err
}

func (api *oryAPI) GetIdentityTwitchOIDC(ctx context.Context, identityID uuid.UUID) (*model.TwitchAuth, error) {
	identity, _, err := api.adminClient.IdentityAPI.GetIdentity(ctx, identityID.String()).IncludeCredential([]string{"oidc"}).Execute()
	if err != nil {
		return nil, err
	}

	json, _ := json.Marshal(identity)
	logger.Debugf(ctx, "Identity: %s", string(json))

	credentials := *identity.Credentials
	for _, credential := range credentials {
		if credential.Config == nil || credential.Config["providers"] == nil {
			continue
		}

		providers := credential.Config["providers"].([]any)
		logger.Debugf(ctx, "Providers: %v", credential.Config)

		for _, providerRaw := range providers {
			provider, ok := providerRaw.(map[string]any)
			if !ok {
				logger.Debugf(ctx, "Provider is not map[string]any: %v", providerRaw)
				continue
			}

			if provider["provider"] == "twitch-extended" {
				logger.Debugf(ctx, "twitch-extended provider: %v", provider)
				initialIDToken := provider["initial_id_token"].(string)
				token, _ := jwt.Parse(initialIDToken, nil)
				claims, ok := token.Claims.(jwt.MapClaims)
				if !ok {
					logger.Debugf(ctx, "Claims is not jwt.MapClaims: %v", claims)
					continue
				}

				issuedAt := time.Unix(int64(claims["iat"].(float64)), 0)
				expiresAt := issuedAt.Add(30 * 24 * time.Hour)

				return &model.TwitchAuth{
					BroadcasterID: provider["subject"].(string),
					AccessToken:   provider["initial_access_token"].(string),
					RefreshToken:  provider["initial_refresh_token"].(string),
					ExpiresIn:     expiresAt,
				}, nil
			}
		}
	}

	return nil, fmt.Errorf("twitch-extended provider not found")
}
