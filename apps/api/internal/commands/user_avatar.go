package commands

import (
	"mime/multipart"

	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type GetUserAvatarURLCommand struct {
	UserID     uuid.UUID
	AvatarSize domain.AvatarSize
}

func (c *GetUserAvatarURLCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.AvatarSize, validation.Required, is2.IsAvatarSize),
	)
}

type UploadAvatarForPreviewCommand struct {
	UserID     uuid.UUID
	File       multipart.File
	FileHeader *multipart.FileHeader
	AvatarSize domain.AvatarSize
}

func (c *UploadAvatarForPreviewCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.AvatarSize, validation.Required, is2.IsAvatarSize),
	)
}
