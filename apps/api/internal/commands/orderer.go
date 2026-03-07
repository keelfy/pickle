package commands

import (
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

type CreateOrdererCommand struct {
	UserID          *uuid.UUID
	Source          domain.OrdererSource
	DisplayName     string
	ReferenceUserID *string
}
