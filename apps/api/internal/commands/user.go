package commands

import (
	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type GetUserByIDCommand struct {
	ID         uuid.UUID
	AvatarSize domain.AvatarSize
}

type GetUserByIDCommandResult struct {
	User      *domain.DetailedUser
	AvatarURL string
	UserCtx   *domain.UserContext
}

type UserSocialLink struct {
	ID       uuid.UUID
	Name     string
	URL      string
	Position int
}

func (link *UserSocialLink) Validate() error {
	return validation.ValidateStruct(link,
		validation.Field(&link.ID, validation.Required, is.UUID),
		validation.Field(&link.Name, validation.Required, validation.Length(1, 50)),
		validation.Field(&link.URL, validation.Required, validation.Length(1, 255), is.URL),
		validation.Field(&link.Position, validation.Min(0)),
	)
}

type SuggestionPreferences struct {
	Enabled            bool
	AllowedFree        bool
	AllowedAnonymously bool
	Categories         []domain.ContentCategory
}

func (req *SuggestionPreferences) Validate() error {
	return validation.ValidateStruct(req,
		validation.Field(&req.Categories, validation.Each(validation.By(func(value interface{}) error {
			c := value.(domain.ContentCategory)
			return validation.Validate(c, validation.Required, is2.IsContentCategory)
		}))),
	)
}

type UpdateUserCommand struct {
	ID                    uuid.UUID
	DisplayName           string
	Username              string
	Description           string
	SocialLinks           []*UserSocialLink
	SuggestionPreferences *SuggestionPreferences
}

func (req *UpdateUserCommand) Validate() error {
	for _, link := range req.SocialLinks {
		if err := link.Validate(); err != nil {
			return err
		}
	}

	if req.SuggestionPreferences != nil {
		if err := req.SuggestionPreferences.Validate(); err != nil {
			return err
		}
	}

	return validation.ValidateStruct(req,
		validation.Field(&req.ID, validation.Required, is.UUID),
		validation.Field(&req.DisplayName, validation.Required, validation.Length(1, 100)),
		validation.Field(&req.Username, validation.Required, validation.Length(3, 50)),
		validation.Field(&req.Description, validation.Length(0, 1000)),
		validation.Field(&req.SocialLinks, validation.Length(0, 10)),
		validation.Field(&req.SuggestionPreferences),
	)
}
