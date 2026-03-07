package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type OrderSource string

const (
	OrderSourceManual              OrderSource = "pickle-manual"
	OrderSourceSuggestion          OrderSource = "pickle-suggestion"
	OrderSourceTwitchChannelPoints OrderSource = "twitch-channel-points"
)

type Order struct {
	ID             uuid.UUID
	CreatedAt      time.Time
	CreatedBy      *uuid.UUID
	UpdatedAt      time.Time
	UpdatedBy      *uuid.UUID
	ReceiverID     uuid.UUID
	OrdererID      uuid.UUID
	Message        string
	Category       ContentCategory
	ContentID      *uuid.UUID
	Anonymous      bool
	Source         OrderSource
	Reference      json.RawMessage
	IdempotencyKey string
	// relations
	CreatedByUser IUser
	UpdatedByUser IUser
	Receiver      IUser
	Content       IContent
	Orderer       *Orderer
	Decisions     []*OrderDecision
}

type OrderDecisionStatus string

const (
	OrderDecisionStatusApproved OrderDecisionStatus = "approved"
	OrderDecisionStatusRejected OrderDecisionStatus = "rejected"
)

type OrderDecision struct {
	ID                  uuid.UUID
	DecidedAt           time.Time
	DecidedBy           uuid.UUID
	DeletedAt           *time.Time
	DeletedBy           *uuid.UUID
	Status              OrderDecisionStatus
	OrderID             uuid.UUID
	ContentNoteID       *uuid.UUID
	ContentNoteCategory *ContentCategory
	// relations
	DecidedByUser IUser
	DeletedByUser IUser
	Order         *Order
	ContentNote   IContentNote
}
