package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/keelfy/helix/v2"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/clients"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
)

type EventsubService interface {
	RequestSubscriptionForChannelPoints(ctx context.Context, auth *db.TwitchAuthorization) (*db.EventsubSubscription, error)
	ActivateAssignedSubscriptions(ctx context.Context, connectionID uuid.UUID, sessionID string) error
	UnsubscribeFromChannelPoints(ctx context.Context, identityID uuid.UUID) error
	GetSubscriptionByReferenceID(ctx context.Context, referenceID string) (*db.EventsubSubscription, error)
	GetSubscriptionsByIdentityID(ctx context.Context, identityID uuid.UUID) ([]*db.EventsubSubscription, error)
	GetActiveSubscriptionsByEventType(ctx context.Context, eventType string, identityID uuid.UUID) ([]*db.EventsubSubscription, error)
}

type eventsubService struct {
	twitchHelixClient clients.TwitchHelixClient
	sqlDB             storage.RelationalStorage
}

func NewEventsubService(twitchHelixClient clients.TwitchHelixClient, sqlDB storage.RelationalStorage) EventsubService {
	return &eventsubService{
		twitchHelixClient: twitchHelixClient,
		sqlDB:             sqlDB,
	}
}

var (
	clientID     = config.GetTwitchClientID()
	clientSecret = config.GetTwitchClientSecret()
)

func (s *eventsubService) subscriptionExists(ctx context.Context, identityID uuid.UUID) (*db.EventsubSubscription, error) {
	subscription, err := s.sqlDB.Queries().FindEventsubSubscriptionByIdentityID(ctx, identityID)
	if err != nil {
		return nil, err
	}

	if len(subscription) == 0 {
		return nil, nil
	}

	return subscription[0], nil
}

func (s *eventsubService) createHelixClientWithUserAuthorization(ctx context.Context, auth *db.TwitchAuthorization) (*helix.Client, error) {
	helixClient, err := helix.NewClient(&helix.Options{
		ClientID:        clientID,
		ClientSecret:    clientSecret,
		UserAccessToken: auth.AccessToken,
		RefreshToken:    auth.RefreshToken,
	})
	if err != nil {
		fmt.Printf("helix client error: %v\n", err)
		return nil, err
	}

	logger.Debugf(ctx, "auth before token refresh: %v", auth)

	// refresh user access token
	refresh, err := helixClient.RefreshUserAccessToken(helixClient.GetRefreshToken())
	if err != nil {
		fmt.Printf("helix client error: %v\n", err)
		return nil, err
	}

	logger.Debugf(ctx, "auth after token refresh: %v", refresh)

	helixClient.SetUserAccessToken(refresh.Data.AccessToken)
	helixClient.SetRefreshToken(refresh.Data.RefreshToken)

	// update twitch authorization with new tokens
	s.sqlDB.Queries().UpdateTwitchAuthorizationByIdentityID(ctx, db.UpdateTwitchAuthorizationByIdentityIDParams{
		IdentityID:   auth.IdentityID,
		AccessToken:  refresh.Data.AccessToken,
		RefreshToken: refresh.Data.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(refresh.Data.ExpiresIn) * time.Second),
	})

	return helixClient, nil
}

func (s *eventsubService) RequestSubscriptionForChannelPoints(ctx context.Context, auth *db.TwitchAuthorization) (*db.EventsubSubscription, error) {
	subscription, err := s.subscriptionExists(ctx, auth.IdentityID)
	if err != nil {
		return nil, err
	}

	if subscription != nil {
		return subscription, nil
	}

	subscription, err = s.sqlDB.Queries().InsertEventsubSubscription(ctx, db.InsertEventsubSubscriptionParams{
		IdentityID: auth.IdentityID,
		EventType:  helix.EventSubTypeChannelPointsCustomRewardRedemptionAdd,
	})
	if err != nil {
		return nil, err
	}

	return subscription, nil
}

func (s *eventsubService) ActivateAssignedSubscriptions(ctx context.Context, connectionID uuid.UUID, sessionID string) error {
	subs, err := s.sqlDB.Queries().FindEventsubSubscriptionsAssignedToConnectionID(ctx, connectionID)
	if err != nil && err != pgx.ErrNoRows {
		return err
	}

	if err == pgx.ErrNoRows || len(subs) == 0 {
		logger.Debugf(ctx, "No subscriptions found for connection %s", connectionID)
		return nil
	}

	// group subscriptions by identity ID
	subsByIdentityID := make(map[uuid.UUID][]*db.EventsubSubscription)
	for _, sub := range subs {
		subsByIdentityID[sub.IdentityID] = append(subsByIdentityID[sub.IdentityID], sub)
	}

	// subscribe to channel points for each identity
	for identityID, subs := range subsByIdentityID {
		auth, err := s.sqlDB.Queries().FindTwitchAuthorizationByIdentityID(ctx, identityID)
		if err != nil {
			return err
		}
		subIDs := make([]string, len(subs))
		for i, sub := range subs {
			subIDs[i] = sub.ID.String()
		}
		logger.Debugf(ctx, "Subscribing to channel points for identity %s (subscriptions: %v)", auth.IdentityID, subIDs)

		helixClient, err := s.createHelixClientWithUserAuthorization(ctx, auth)
		if err != nil {
			return err
		}

		for _, sub := range subs {
			// delete previous subscription in twitch
			if sub.ReferenceID != nil && *sub.ReferenceID != "" {
				_, err = helixClient.RemoveEventSubSubscription(*sub.ReferenceID)
				if err != nil {
					logger.Errorf(ctx, "Failed to delete subscription %s: %v", *sub.ReferenceID, err)
				}
			}

			// create subscription in twitch
			transport := helix.EventSubTransport{
				Method:    "websocket",
				SessionID: sessionID,
			}
			response, err := helixClient.CreateEventSubSubscription(&helix.EventSubSubscription{
				Type:    helix.EventSubTypeChannelPointsCustomRewardRedemptionAdd,
				Version: "1",
				Condition: helix.EventSubCondition{
					BroadcasterUserID: auth.BroadcasterID,
				},
				Transport: transport,
			})
			if err != nil {
				return err
			}

			if len(response.Data.EventSubSubscriptions) == 0 {
				return fmt.Errorf("failed to create subscription: %v", response)
			}

			// debug logging
			if config.IsDebug() {
				jsonb, err := json.Marshal(response)
				if err != nil {
					return err
				}
				logger.Debugf(ctx, "EventSub %s: %s", helix.EventSubTypeChannelPointsCustomRewardRedemptionAdd, string(jsonb))

				// res, err := helixClient.GetEventSubSubscriptions(&helix.EventSubSubscriptionsParams{})
				// if err != nil {
				// 	return err
				// }
				// jsonb, err = json.Marshal(res)
				// logger.Debugf(ctx, "List of subscriptions: %s", string(jsonb))
			}

			// update subscription status in db
			err = s.sqlDB.Queries().UpdateEventsubSubscriptionStatus(ctx, db.UpdateEventsubSubscriptionStatusParams{
				ID:          sub.ID,
				Status:      "subscribed",
				ReferenceID: response.Data.EventSubSubscriptions[0].ID,
			})
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (s *eventsubService) UnsubscribeFromChannelPoints(ctx context.Context, identityID uuid.UUID) error {
	subscriptions, err := s.sqlDB.Queries().FindEventsubSubscriptionByIdentityID(ctx, identityID)
	if err != nil && err != pgx.ErrNoRows {
		return err
	}

	if err == pgx.ErrNoRows || len(subscriptions) == 0 {
		logger.Debugf(ctx, "No subscriptions found for identity %s", identityID)
		return nil
	}

	auth, err := s.sqlDB.Queries().FindTwitchAuthorizationByIdentityID(ctx, identityID)
	if err != nil && err != pgx.ErrNoRows {
		return err
	}

	if err == pgx.ErrNoRows {
		logger.Debugf(ctx, "No auth found for identity %s", identityID)
		return nil
	}

	helixClient, err := s.createHelixClientWithUserAuthorization(ctx, auth)
	if err != nil {
		return err
	}

	for _, sub := range subscriptions {
		if sub.ReferenceID != nil && *sub.ReferenceID != "" {
			_, err = helixClient.RemoveEventSubSubscription(*sub.ReferenceID)
			if err != nil {
				logger.Errorf(ctx, "Failed to delete subscription %s: %v", *sub.ReferenceID, err)
			}
		}
	}

	return nil
}

func (s *eventsubService) GetSubscriptionByReferenceID(ctx context.Context, referenceID string) (*db.EventsubSubscription, error) {
	subscription, err := s.sqlDB.Queries().FindEventsubSubscriptionByReferenceID(ctx, referenceID)
	if err != nil {
		return nil, err
	}
	return subscription, nil
}

func (s *eventsubService) GetSubscriptionsByIdentityID(ctx context.Context, identityID uuid.UUID) ([]*db.EventsubSubscription, error) {
	subscription, err := s.sqlDB.Queries().FindEventsubSubscriptionByIdentityID(ctx, identityID)
	if err != nil {
		return nil, err
	}
	return subscription, nil
}

func (s *eventsubService) GetActiveSubscriptionsByEventType(ctx context.Context, eventType string, identityID uuid.UUID) ([]*db.EventsubSubscription, error) {
	subscriptions, err := s.sqlDB.Queries().FindActiveSubscriptionsByEventType(ctx, db.FindActiveSubscriptionsByEventTypeParams{
		EventType:  eventType,
		IdentityID: identityID,
	})
	if err != nil {
		return nil, err
	}
	return subscriptions, nil
}
