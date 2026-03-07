package response

type CustomChannelReward struct {
	ID                  string `json:"id"`
	Title               string `json:"title"`
	Prompt              string `json:"prompt"`
	BackgroundColor     string `json:"backgroundColor"`
	Image               string `json:"image"`
	Cost                int    `json:"cost"`
	IsEnabled           bool   `json:"isEnabled"`
	IsPaused            bool   `json:"isPaused"`
	IsInStock           bool   `json:"isInStock"`
	IsUserInputRequired bool   `json:"isUserInputRequired"`
}

type TrackedChannelReward struct {
	*CustomChannelReward
	Category string `json:"category"`
}

type RewardsPreferences struct {
	TrackedRewards  []*TrackedChannelReward `json:"trackedRewards"`
	TrackingEnabled bool                    `json:"trackingEnabled"`
	IsActive        bool                    `json:"isActive"`
}

type BroadcasterPreferences struct {
	Rewards RewardsPreferences `json:"rewards"`
}
