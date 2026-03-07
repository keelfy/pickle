package commands

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type AddModeratorCommand struct {
	UserID     uuid.UUID
	Username   string
	AvatarSize domain.AvatarSize
}

func (c *AddModeratorCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Username, validation.Required, validation.Length(1, 50)),
		validation.Field(&c.AvatarSize, validation.Required, is2.IsAvatarSize),
	)
}

type DeleteModeratorCommand struct {
	UserID          uuid.UUID
	ModeratorUserID uuid.UUID
}

func (c *DeleteModeratorCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.ModeratorUserID, validation.Required, is.UUID),
	)
}
