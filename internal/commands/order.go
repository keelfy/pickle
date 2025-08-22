package commands

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type GetOrderByIDCommand struct {
	ID uuid.UUID
}

func (c *GetOrderByIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
	)
}

type GetSortedOrdersByUserIDCommand struct {
	UserID     uuid.UUID
	Sort       *domain.CursorSort
	Filters    domain.Filters
	AvatarSize domain.AvatarSize
	CoverSize  domain.CoverSize
}

func (c *GetSortedOrdersByUserIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.AvatarSize, validation.Required, is2.IsAvatarSize),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
	)
}

type CreateOrderCommand struct {
	ReceiverID    uuid.UUID
	IsAnonymously bool
	Category      domain.ContentCategory
	ContentID     *uuid.UUID
	Message       string
	Source        domain.OrderSource
	Reference     *string
}

func (c *CreateOrderCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ReceiverID, validation.Required, is.UUID),
		validation.Field(&c.IsAnonymously, validation.Required),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.ContentID, validation.NilOrNotEmpty, is.UUID),
		validation.Field(&c.Message, validation.Required, validation.Length(0, 250)),
		validation.Field(&c.Source, validation.Required, is2.IsOrderSource),
		validation.Field(&c.Reference, validation.NilOrNotEmpty),
	)
}

type ApproveOrderCommand struct {
	ID              uuid.UUID
	ReceiverID      uuid.UUID
	ContentCategory domain.ContentCategory
	ContentID       uuid.UUID
	CoverSize       domain.CoverSize
	AvatarSize      domain.AvatarSize
}

func (c *ApproveOrderCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.ReceiverID, validation.Required, is.UUID),
		validation.Field(&c.ContentCategory, validation.Required, is2.IsContentCategory),
		validation.Field(&c.ContentID, validation.Required, is.UUID),
		validation.Field(&c.CoverSize, is2.IsCoverSize),
		validation.Field(&c.AvatarSize, is2.IsAvatarSize),
	)
}

type RejectOrderCommand struct {
	ID         uuid.UUID
	ReceiverID uuid.UUID
	AvatarSize domain.AvatarSize
}

func (c *RejectOrderCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.ReceiverID, validation.Required, is.UUID),
		validation.Field(&c.AvatarSize, is2.IsAvatarSize),
	)
}
