package presenter

import (
	"github.com/keelfy/helix/v2"
	"github.com/pickle-pw/twitch-harbor/internal/transport/http/response"
)

func PresentCustomChannelReward(reward *helix.ChannelCustomReward) *response.CustomChannelReward {
	image := reward.Image.Url1x
	if image == "" {
		image = reward.DefaultImage.Url1x
	}

	return &response.CustomChannelReward{
		ID:                  reward.ID,
		Title:               reward.Title,
		Prompt:              reward.Prompt,
		BackgroundColor:     reward.BackgroundColor,
		Cost:                reward.Cost,
		IsEnabled:           reward.IsEnabled,
		IsPaused:            reward.IsPaused,
		IsInStock:           reward.IsInStock,
		IsUserInputRequired: reward.IsUserInputRequired,
		Image:               image,
	}
}

func PresentTrackedChannelReward(reward *helix.ChannelCustomReward, category string) *response.TrackedChannelReward {
	return &response.TrackedChannelReward{
		CustomChannelReward: PresentCustomChannelReward(reward),
		Category:            category,
	}
}
