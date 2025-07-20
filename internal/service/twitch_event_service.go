package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/nicklaw5/helix/v2"
	db "github.com/pickle-pw/twitch-harbor/db/sqlc"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
	twitchws "github.com/vpetrigo/go-twitch-ws"
	"github.com/vpetrigo/go-twitch-ws/pkg/eventsub"
)

type TwitchEventService interface {
	OnWelcomeEvent(ctx context.Context, connID uuid.UUID, metadata *twitchws.Metadata, sessionID string)
	OnNotificationEvent(ctx context.Context, metadata *twitchws.Metadata, notification *twitchws.Notification)
	OnKeepaliveEvent(ctx context.Context, connID uuid.UUID, metadata *twitchws.Metadata, sessionID *string)
	OnReconnect(ctx context.Context, metadata *twitchws.Metadata, payload *twitchws.Payload)
	OnRevocationEvent(ctx context.Context, metadata *twitchws.Metadata, payload *twitchws.Payload)
}

type twitchEventService struct {
	twitchAuthService  TwitchAuthService
	eventsubService    EventsubService
	sqlDB              storage.RelationalStorage
	broadcasterService BroadcasterService
	orderService       OrderService
}

func NewTwitchEventService(
	twitchAuthService TwitchAuthService,
	eventsubService EventsubService,
	sqlDB storage.RelationalStorage,
	broadcasterService BroadcasterService,
	orderService OrderService,
) TwitchEventService {
	return &twitchEventService{
		twitchAuthService:  twitchAuthService,
		eventsubService:    eventsubService,
		sqlDB:              sqlDB,
		broadcasterService: broadcasterService,
		orderService:       orderService,
	}
}

func (s *twitchEventService) OnWelcomeEvent(ctx context.Context, connID uuid.UUID, metadata *twitchws.Metadata, sessionID string) {
	err := s.eventsubService.ActivateAssignedSubscriptions(ctx, connID, sessionID)
	if err != nil {
		logger.Debugf(ctx, "error activating assigned subscriptions: %v", err)
	}
}

func (s *twitchEventService) OnNotificationEvent(ctx context.Context, metadata *twitchws.Metadata, notification *twitchws.Notification) {
	s.OnChannelPointsCustomRewardRedemptionAddEvent(ctx, notification)
}

func (s *twitchEventService) OnChannelPointsCustomRewardRedemptionAddEvent(ctx context.Context, notification *twitchws.Notification) {
	rawEvent, err := json.Marshal(notification.Event)
	if err != nil {
		logger.Debugf(ctx, "error marshalling event: %v", err)
		return
	}

	event := &eventsub.ChannelPointsCustomRewardRedemptionAddEvent{}
	err = json.Unmarshal(rawEvent, event)
	if err != nil {
		logger.Debugf(ctx, "error unmarshalling event: %v", err)
		return
	}

	auth, err := s.twitchAuthService.GetAuthByBroadcasterID(ctx, event.BroadcasterUserID)
	if err != nil {
		fmt.Printf("error getting auth: %v\n", err)
		return
	}

	trackedRewards, err := s.broadcasterService.GetBroadcasterTrackedRewards(ctx, auth.BroadcasterID)
	if err != nil {
		logger.Debugf(ctx, "error getting tracked rewards: %v", err)
		return
	}

	if _, ok := trackedRewards[event.Reward.ID]; !ok {
		logger.Debugf(ctx, "reward %s is not tracked by broadcaster %s", event.Reward.ID, auth.BroadcasterID)
		return
	}

	category := trackedRewards[event.Reward.ID]

	var subscriptionID *uuid.UUID
	subscription, err := s.eventsubService.GetSubscriptionByReferenceID(ctx, notification.Subscription.ID)
	if err != nil {
		logger.Debugf(ctx, "error getting subscription: %v", err)
	} else {
		subscriptionID = &subscription.ID
	}

	not, err := s.sqlDB.Queries().InsertTwitchNotification(ctx, db.InsertTwitchNotificationParams{
		IdentityID:     auth.IdentityID,
		SubscriptionID: subscriptionID,
		MessageType:    helix.EventSubTypeChannelPointsCustomRewardRedemptionAdd,
		Payload:        rawEvent,
		// add category
		Status: "received",
	})
	if err != nil {
		logger.Debugf(ctx, "error inserting twitch notification: %v", err)
		return
	}

	// TODO: 1. send message to order microservice via http (try 3 times with exponential backoff)
	// TODO: 2. update notification status to "transferred" or "failed_to_transfer"
	// TODO: 3. if notification is in "failed_to_transfer" state, handle it with scheduled task to retry later

	go func() {
		status := "transferred"

		retryCount, err := s.orderService.CreateOrderFromNotification(ctx, auth.IdentityID, category, event)
		if err != nil {
			logger.Debugf(ctx, "error creating order: %v", err)
			status = "failed_to_transfer"
		}

		err = s.sqlDB.Queries().UpdateTwitchNotificationStatus(ctx, db.UpdateTwitchNotificationStatusParams{
			ID:         not.ID,
			Status:     status,
			RetryCount: int32(retryCount),
		})
		if err != nil {
			logger.Debugf(ctx, "error updating twitch notification status: %v", err)
		}
	}()
}

func (s *twitchEventService) OnKeepaliveEvent(ctx context.Context, connID uuid.UUID, metadata *twitchws.Metadata, sessionID *string) {
	if sessionID != nil && *sessionID != "" {
		err := s.eventsubService.ActivateAssignedSubscriptions(ctx, connID, *sessionID)
		if err != nil {
			logger.Debugf(ctx, "error activating assigned subscriptions: %v", err)
		}
	}
}

func (s *twitchEventService) OnReconnect(ctx context.Context, metadata *twitchws.Metadata, payload *twitchws.Payload) {

}

func (s *twitchEventService) OnRevocationEvent(ctx context.Context, metadata *twitchws.Metadata, payload *twitchws.Payload) {

}
