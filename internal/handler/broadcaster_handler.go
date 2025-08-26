package handler

import (
	"encoding/json"
	"net/http"
	"sync"
	"sync/atomic"

	"github.com/google/uuid"
	"github.com/keelfy/helix/v2"
	"github.com/pickle-pw/twitch-harbor/internal/domain"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/middleware"
	"github.com/pickle-pw/twitch-harbor/internal/model"
	"github.com/pickle-pw/twitch-harbor/internal/presenter"
	"github.com/pickle-pw/twitch-harbor/internal/service"
	"github.com/pickle-pw/twitch-harbor/internal/transport/http/response"
	"github.com/pickle-pw/twitch-harbor/internal/util"
)

type BroadcasterHandler interface {
	GetBroadcasterPreferences(w http.ResponseWriter, r *http.Request)
	GetBroadcasterAvailableRewards(w http.ResponseWriter, r *http.Request)
	SaveBroadcasterPreferences(w http.ResponseWriter, r *http.Request)
	FetchTrackedRewardsRedemptions(w http.ResponseWriter, r *http.Request)
}

type broadcasterHandler struct {
	broadcasterService  service.BroadcasterService
	twitchAuthService   service.TwitchAuthService
	twitchRewardService service.TwitchRewardService
	orderService        service.OrderService
	eventsubService     service.EventsubService
}

func NewBroadcasterHandler(
	broadcasterService service.BroadcasterService,
	twitchAuthService service.TwitchAuthService,
	twitchRewardService service.TwitchRewardService,
	orderService service.OrderService,
	eventsubService service.EventsubService,
) BroadcasterHandler {
	return &broadcasterHandler{
		broadcasterService:  broadcasterService,
		twitchAuthService:   twitchAuthService,
		twitchRewardService: twitchRewardService,
		orderService:        orderService,
		eventsubService:     eventsubService,
	}
}

func (h *broadcasterHandler) GetBroadcasterPreferences(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	session, err := middleware.GetSession(ctx)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewForbiddenError("Failed to get session", err), w)
		return
	}

	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewForbiddenError("Failed to get identity ID", err), w)
		return
	}

	auth, err := h.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewInternalServerError("Failed to get auth", err), w)
		return
	}

	subscriptions, err := h.eventsubService.GetActiveSubscriptionsByEventType(ctx, helix.EventSubTypeChannelPointsCustomRewardRedemptionAdd, identityID)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewInternalServerError("Failed to get broadcaster preferences", err), w)
		return
	}

	allChannelRewards, err := h.twitchRewardService.GetAvailableTwitchRewards(ctx, session)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewInternalServerError("Failed to get broadcaster preferences", err), w)
		return
	}

	trackedRewards, err := h.broadcasterService.GetBroadcasterTrackedRewards(ctx, auth.BroadcasterID)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewInternalServerError("Failed to get broadcaster preferences", err), w)
		return
	}

	trackedRewardResponses := make([]*response.TrackedChannelReward, 0)

	for _, reward := range allChannelRewards {
		var trackedReward *domain.TrackedReward
		for _, tr := range trackedRewards {
			if reward.ID == tr.RewardID {
				trackedReward = tr
				break
			}
		}

		if trackedReward != nil {
			trackedRewardResponses = append(trackedRewardResponses, presenter.PresentTrackedChannelReward(reward, trackedReward.Category))
		}
	}

	isRewardTrackingActive := len(subscriptions) > 0
	rewardsPreferences := response.RewardsPreferences{
		TrackedRewards:  trackedRewardResponses,
		TrackingEnabled: isRewardTrackingActive,
		IsActive:        isRewardTrackingActive,
	}

	response := response.BroadcasterPreferences{
		Rewards: rewardsPreferences,
	}

	util.WriteHttpJsonResponse(ctx, w, response)
}

func (h *broadcasterHandler) GetBroadcasterAvailableRewards(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	session, err := middleware.GetSession(ctx)
	if err != nil {
		util.HttpError(ctx, model.NewForbiddenError("Failed to get session", err), w)
		return
	}

	availableRewards, err := h.twitchRewardService.GetAvailableTwitchRewards(ctx, session)
	if err != nil {
		util.HttpError(ctx, model.NewInternalServerError("Failed to get available rewards", err), w)
		return
	}

	trackedRewards, err := h.broadcasterService.GetBroadcasterTrackedRewards(ctx, session.Identity.Id)
	if err != nil {
		util.HttpError(ctx, model.NewInternalServerError("Failed to get tracked rewards", err), w)
		return
	}

	res := make([]*response.CustomChannelReward, 0)
	for _, reward := range availableRewards {
		isTracked := false
		for _, trackedReward := range trackedRewards {
			if reward.ID == trackedReward.RewardID {
				isTracked = true
				break
			}
		}

		if !isTracked {
			res = append(res, presenter.PresentCustomChannelReward(reward))
		}
	}

	util.WriteHttpJsonResponse(ctx, w, res)
}

func (h *broadcasterHandler) SaveBroadcasterPreferences(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req model.BroadcasterPreferencesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	if err := req.Validate(); err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	session, err := middleware.GetSession(ctx)
	if err != nil {
		util.LogAndWriteError(ctx, model.NewForbiddenError("Failed to get session", err), w)
		return
	}

	err = h.broadcasterService.SaveBroadcasterPreferences(ctx, session, &req)
	if err != nil {
		util.LogAndWriteError(ctx, err, w)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *broadcasterHandler) FetchTrackedRewardsRedemptions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	session, err := middleware.GetSession(ctx)
	if err != nil {
		util.HttpError(ctx, model.NewForbiddenError("Failed to get session", err), w)
		return
	}

	identityID, err := uuid.Parse(session.Identity.Id)
	if err != nil {
		util.HttpError(ctx, model.NewForbiddenError("Failed to get identity ID", err), w)
		return
	}

	auth, err := h.twitchAuthService.GetAuthByIdentityID(ctx, identityID)
	if err != nil {
		util.HttpError(ctx, model.NewInternalServerError("Failed to get auth", err), w)
		return
	}

	trackedRewards, err := h.broadcasterService.GetBroadcasterTrackedRewards(ctx, auth.BroadcasterID)
	if err != nil {
		util.HttpError(ctx, err, w)
		return
	}

	rewardIDs := make([]string, len(trackedRewards))
	for i, trackedReward := range trackedRewards {
		rewardIDs[i] = trackedReward.RewardID
	}

	redemptions, err := h.twitchRewardService.GetExistingTwitchRewardsRedemptions(ctx, session, rewardIDs)
	if err != nil {
		util.HttpError(ctx, err, w)
		return
	}

	logger.Debugf(ctx, "fetched %v redemptions by broadcaster %v", len(redemptions), auth.BroadcasterID)

	var wg sync.WaitGroup
	var suggestionsImported atomic.Int32

	for _, redemption := range redemptions {
		wg.Add(1)
		go func() {
			defer wg.Done()

			var reward *domain.TrackedReward
			for _, trackedReward := range trackedRewards {
				if trackedReward.RewardID == redemption.Reward.ID {
					reward = trackedReward
					break
				}
			}

			if reward == nil {
				logger.Warnf(ctx, "redemption fetched but reward not found: %v", redemption)
				return
			}

			_, err := h.orderService.CreateOrderFromRewardRedemption(ctx, identityID, reward, redemption)
			if err != nil {
				logger.Errorf(ctx, "failed to create order from reward redemption: %v", err)
			}

			suggestionsImported.Add(1)
		}()
	}

	wg.Wait()

	util.WriteHttpJsonResponse(ctx, w, struct {
		SuggestionsImported int `json:"suggestionsImported"`
	}{
		SuggestionsImported: int(suggestionsImported.Load()),
	})
}
