package model

import validation "github.com/go-ozzo/ozzo-validation"

type BroadcasterPreferencesRequest struct {
	Rewards RewardsPreferencesRequest `json:"rewards"`
}

func (req *BroadcasterPreferencesRequest) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Rewards, validation.Required),
	)
}

type RewardsPreferencesRequest struct {
	TrackedRewards []*ChannelRewardRequest `json:"trackedRewards"`
}

func (req *RewardsPreferencesRequest) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.TrackedRewards, validation.Required, validation.Length(0, 100)),
	)
}

type ChannelRewardRequest struct {
	RewardID string `json:"rewardId"`
	Category string `json:"category"`
}

func (req *ChannelRewardRequest) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.RewardID, validation.Required, validation.Length(1, 200)),
		validation.Field(&req.Category, validation.Required, validation.Length(1, 200)),
	)
}
