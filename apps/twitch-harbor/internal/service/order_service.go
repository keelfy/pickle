package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pickle-pw/twitch-harbor/internal/config"
	"github.com/pickle-pw/twitch-harbor/internal/domain"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/storage"
	"github.com/vpetrigo/go-twitch-ws/pkg/eventsub"
)

type OrderService interface {
	CreateOrderFromNotification(ctx context.Context, identityID uuid.UUID, category string, event *eventsub.ChannelPointsCustomRewardRedemptionAddEvent) (int, error)
	CreateOrderFromRewardRedemption(ctx context.Context, identityID uuid.UUID, reward *domain.TrackedReward, redemption *domain.RewardRedemption) (int, error)
}

type orderService struct {
	sqlDB      storage.RelationalStorage
	httpClient *http.Client
}

func NewOrderService(sqlDB storage.RelationalStorage) OrderService {
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	return &orderService{
		sqlDB:      sqlDB,
		httpClient: httpClient,
	}
}

type CreateOrderReq struct {
	IdempotencyKey  string  `json:"idempotencyKey"`
	IsAnonymously   bool    `json:"isAnonymously"`
	Category        string  `json:"category"`
	Message         string  `json:"message"`
	Source          string  `json:"source"`
	OrdererUsername string  `json:"ordererUsername"`
	Reference       *string `json:"reference"`
	ReferenceUserID *string `json:"referenceUserId"`
}

func (s *orderService) CreateOrderFromNotification(ctx context.Context, identityID uuid.UUID, category string, event *eventsub.ChannelPointsCustomRewardRedemptionAddEvent) (int, error) {
	var redeemedAt time.Time
	at, err := time.Parse(time.RFC3339, event.RedeemedAt)
	if err != nil {
		logger.Debugf(ctx, "failed to parse redeemed at: %v", err)
		redeemedAt = time.Now()
	} else {
		redeemedAt = at
	}

	redemption := &domain.RewardRedemption{
		ID:               event.ID,
		BroadcasterID:    event.BroadcasterUserID,
		BroadcasterLogin: event.BroadcasterUserLogin,
		BroadcasterName:  event.BroadcasterUserName,
		UserID:           event.UserID,
		UserName:         event.UserName,
		UserLogin:        event.UserLogin,
		UserInput:        event.UserInput,
		Status:           event.Status,
		RedeemedAt:       redeemedAt,
	}
	reward := &domain.TrackedReward{
		RewardID: event.Reward.ID,
		Category: category,
	}
	return s.CreateOrderFromRewardRedemption(ctx, identityID, reward, redemption)
}

func (s *orderService) CreateOrderFromRewardRedemption(ctx context.Context, identityID uuid.UUID, reward *domain.TrackedReward, redemption *domain.RewardRedemption) (int, error) {
	reference, err := json.Marshal(redemption)
	if err != nil {
		return 0, err
	}
	referenceString := string(reference)

	body, err := json.Marshal(&CreateOrderReq{
		IdempotencyKey:  fmt.Sprintf("%s-%s", reward.RewardID, redemption.ID),
		IsAnonymously:   true,
		Category:        reward.Category,
		Message:         redemption.UserInput,
		Source:          "twitch-channel-points",
		OrdererUsername: redemption.UserName,
		Reference:       &referenceString,
		ReferenceUserID: &redemption.UserID,
	})
	if err != nil {
		return 0, err
	}

	endpoint := strings.Replace(config.GetCreateOrderEndpoint(), "{userId}", identityID.String(), 1)
	url := config.GetOrderServiceUrl() + endpoint
	req, err := http.NewRequest(config.GetCreateOrderEndpointMethod(), url, bytes.NewBuffer(body))
	if err != nil {
		return 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", config.GetApiKey())

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	retryCount := 0
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		logger.Debugf(ctx, "failed to create order: %s", resp.Status)

		// retry 3 times with exponential backoff
		for retryCount < 3 {
			req.Body = io.NopCloser(bytes.NewBuffer(body))
			resp, err = s.httpClient.Do(req)
			if err != nil {
				return retryCount, err
			}

			if resp.StatusCode == http.StatusOK {
				break
			}

			time.Sleep(time.Duration(retryCount+1) * time.Second)
			retryCount++
		}
	}

	return retryCount, nil
}
