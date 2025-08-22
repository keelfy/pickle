package commands

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type GetContentByIDCommand struct {
	ID        uuid.UUID
	Category  domain.ContentCategory
	CoverSize domain.CoverSize
}

func (c *GetContentByIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
	)
}

type SearchContentCommand struct {
	Category   domain.ContentCategory
	Query      string
	UserID     uuid.UUID
	Pagination *domain.Pagination
	CoverSize  domain.CoverSize
}

func (c *SearchContentCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.Query, validation.Required, validation.Length(1, 200)),
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Pagination, validation.Required),
	)
}

type SearchContentResult = domain.Paginated[domain.SearchHit[domain.IContent]]

type SearchUserContentCommand struct {
	UserID     uuid.UUID
	Query      string
	Pagination *domain.Pagination
	CoverSize  domain.CoverSize
}

func (c *SearchUserContentCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Query, validation.Required, validation.Length(0, 200)),
		validation.Field(&c.Pagination, validation.Required),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
	)
}

type SearchUserContentResult = domain.Paginated[domain.SearchHit[*domain.UserContent]]
