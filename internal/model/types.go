package model

import "time"

type TwitchAuth struct {
	BroadcasterID string    `json:"broadcasterId"`
	AccessToken   string    `json:"accessToken"`
	RefreshToken  string    `json:"refreshToken"`
	ExpiresIn     time.Time `json:"expiresIn"`
}

type ChannelReward struct {
	ID                  string `json:"id"`
	Title               string `json:"title"`
	Prompt              string `json:"prompt"`
	BackgroundColor     string `json:"backgroundColor"`
	Cost                int    `json:"cost"`
	IsEnabled           bool   `json:"isEnabled"`
	IsPaused            bool   `json:"isPaused"`
	IsInStock           bool   `json:"isInStock"`
	IsUserInputRequired bool   `json:"isUserInputRequired"`
	Category            string `json:"category"`
}

type RewardsPreferences struct {
	TrackedRewards   []*ChannelReward `json:"trackedRewards"`
	AvailableRewards []*ChannelReward `json:"availableRewards"`
	TrackingEnabled  bool             `json:"trackingEnabled"`
	IsActive         bool             `json:"isActive"`
}

type BroadcasterPreferences struct {
	Rewards RewardsPreferences `json:"rewards"`
}
