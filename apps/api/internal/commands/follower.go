package commands

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
)

type FollowUserCommand struct {
	UserID         uuid.UUID
	FollowerUserID uuid.UUID
}

func (c *FollowUserCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.FollowerUserID, validation.Required, is.UUID),
	)
}
