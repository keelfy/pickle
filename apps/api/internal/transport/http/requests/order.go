package requests

import (
	"github.com/google/uuid"
)

type PickleSuggestionOrder struct {
	IsAnonymously bool       `json:"isAnonymously"`
	Category      string     `json:"category"`
	ContentID     *uuid.UUID `json:"contentId"`
	Message       string     `json:"message"`
}

type CreateOrder struct {
	IsAnonymously   bool       `json:"isAnonymously"`
	Category        string     `json:"category"`
	ContentID       *uuid.UUID `json:"contentId"`
	Message         string     `json:"message"`
	Source          string     `json:"source"`
	OrdererUsername string     `json:"ordererUsername"`
	Reference       *string    `json:"reference"`
	ReferenceUserID *string    `json:"referenceUserId"`
	IdempotencyKey  string     `json:"idempotencyKey"`
}

type ApproveOrder struct {
	Category  string    `json:"category"`
	ContentID uuid.UUID `json:"contentId"`
}
