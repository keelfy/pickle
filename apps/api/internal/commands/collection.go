package commands

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type CreateCollectionCommand struct {
	UserID uuid.UUID
	Name   string
}

func (c *CreateCollectionCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Name, validation.Required, validation.Length(1, 100)),
	)
}

type DeleteCollectionCommand struct {
	CollectionID uuid.UUID
}

func (c *DeleteCollectionCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.CollectionID, validation.Required, is.UUID),
	)
}

type UpdateCollectionCommand struct {
	CollectionID uuid.UUID
	Name         string
}

func (c *UpdateCollectionCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.CollectionID, validation.Required, is.UUID),
		validation.Field(&c.Name, validation.Required, validation.Length(1, 100)),
	)
}

type AddCollectionItemCommand struct {
	UserID       uuid.UUID
	CollectionID uuid.UUID
	ItemID       uuid.UUID
	Category     domain.ContentCategory
	CoverSize    domain.CoverSize
}

func (c *AddCollectionItemCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.CollectionID, validation.Required, is.UUID),
		validation.Field(&c.ItemID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
	)
}

type DeleteCollectionItemCommand struct {
	UserID       uuid.UUID
	CollectionID uuid.UUID
	ItemID       uuid.UUID
}

func (c *DeleteCollectionItemCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.CollectionID, validation.Required, is.UUID),
		validation.Field(&c.ItemID, validation.Required, is.UUID),
	)
}

type GetCollectionItemsByUserIDCommand struct {
	UserID     uuid.UUID
	CoverSize  domain.CoverSize
	Pagination *domain.Pagination
}

func (c *GetCollectionItemsByUserIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
		validation.Field(&c.Pagination, validation.Required),
	)
}

type GetCollectionItemsCommand struct {
	CollectionID uuid.UUID
	CoverSize    domain.CoverSize
	Pagination   *domain.Pagination
}

func (c *GetCollectionItemsCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.CollectionID, validation.Required, is.UUID),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
		validation.Field(&c.Pagination, validation.Required),
	)
}
