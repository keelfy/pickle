package domain

import (
	"github.com/google/uuid"
)

type OrdererSource string

const (
	OrdererSourceInternal OrdererSource = "pickle"
	OrdererSourceTwitch   OrdererSource = "twitch"
)

type Orderer struct {
	ID              uuid.UUID
	UserID          *uuid.UUID
	DisplayName     string
	Source          OrdererSource
	ReferenceUserID *string
	// relations
	Orders []*Order
	User   *User
}
