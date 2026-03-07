package domain

import (
	"time"

	"github.com/google/uuid"
)

type ChannelReward struct {
	ID                  string
	Title               string
	Prompt              string
	BackgroundColor     string
	Cost                int
	IsEnabled           bool
	IsPaused            bool
	IsInStock           bool
	IsUserInputRequired bool
	Category            string
}

type TrackedReward struct {
	BroadcasterID string
	RewardID      string
	Category      string
	CreatedAt     *time.Time
	UpdatedAt     *time.Time
	UpdatedBy     uuid.UUID
}

type RewardRedemption struct {
	ID               string
	BroadcasterID    string
	BroadcasterLogin string
	BroadcasterName  string
	UserID           string
	UserName         string
	UserLogin        string
	UserInput        string
	Status           string
	RedeemedAt       time.Time
	// relation
	Reward *ChannelReward
}
