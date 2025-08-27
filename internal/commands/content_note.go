package commands

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/go-ozzo/ozzo-validation/is"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	is2 "github.com/pickle.pw/monolith/internal/utils/is"
)

type ICreateContentNoteCommand interface {
	GetUserID() uuid.UUID
	GetOrderer() *CreateOrdererCommand
	GetContentID() uuid.UUID
	GetCategory() domain.ContentCategory
	GetStatus() *string
	GetRate() *int16
	GetComment() string
	GetCoverSize() domain.CoverSize
	GetInitialOrdererAvatarSize() domain.AvatarSize

	Validate() error
}

type CreateContentNoteCommand struct {
	UserID                   uuid.UUID
	ContentID                uuid.UUID
	Category                 domain.ContentCategory
	Status                   *string
	Rate                     *int16
	Comment                  string
	Orderer                  *CreateOrdererCommand
	CoverSize                domain.CoverSize
	InitialOrdererAvatarSize domain.AvatarSize
}

func (c *CreateContentNoteCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&c.Comment, validation.Length(0, 1000)),
		validation.Field(&c.ContentID, validation.Required, is.UUID),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
		validation.Field(&c.InitialOrdererAvatarSize, validation.Required, is2.IsAvatarSize),
	)
}

func (c *CreateContentNoteCommand) GetUserID() uuid.UUID {
	return c.UserID
}

func (c *CreateContentNoteCommand) GetOrderer() *CreateOrdererCommand {
	return c.Orderer
}

func (c *CreateContentNoteCommand) GetContentID() uuid.UUID {
	return c.ContentID
}

func (c *CreateContentNoteCommand) GetCategory() domain.ContentCategory {
	return c.Category
}

func (c *CreateContentNoteCommand) GetStatus() *string {
	return c.Status
}

func (c *CreateContentNoteCommand) GetRate() *int16 {
	return c.Rate
}

func (c *CreateContentNoteCommand) GetComment() string {
	return c.Comment
}

func (c *CreateContentNoteCommand) GetCoverSize() domain.CoverSize {
	return c.CoverSize
}

func (c *CreateContentNoteCommand) GetInitialOrdererAvatarSize() domain.AvatarSize {
	return c.InitialOrdererAvatarSize
}

type CreateGameNoteCommand struct {
	*CreateContentNoteCommand
	LastPlayedAt *time.Time
}

func (c *CreateGameNoteCommand) GetLastPlayedAt() *time.Time {
	return c.LastPlayedAt
}

func (c *CreateGameNoteCommand) Validate() error {
	err := c.CreateContentNoteCommand.Validate()
	if err != nil {
		return err
	}

	return validation.ValidateStruct(c,
		validation.Field(&c.Status, validation.Required, is2.IsGameNoteStatus),
		validation.Field(&c.LastPlayedAt, validation.NilOrNotEmpty),
	)
}

type CreateMovieNoteCommand struct {
	*CreateContentNoteCommand
	WatchedAt *time.Time
}

func (c *CreateMovieNoteCommand) GetWatchedAt() *time.Time {
	return c.WatchedAt
}

func (c *CreateMovieNoteCommand) Validate() error {
	err := c.CreateContentNoteCommand.Validate()
	if err != nil {
		return err
	}

	return validation.ValidateStruct(c,
		validation.Field(&c.Status, validation.Required, is2.IsMovieNoteStatus),
		validation.Field(&c.WatchedAt, validation.NilOrNotEmpty),
	)
}

type CreateContentNoteCommandResult struct {
	DetailedContentNote     domain.IDetailedContentNote
	InitialOrderer          *domain.Orderer
	InitialOrdererUser      *domain.User
	InitialOrdererAvatarURL string
	CoverURL                *string
	IsNoted                 bool
}

type IUpdateContentNoteCommand interface {
	GetID() uuid.UUID
	GetCategory() domain.ContentCategory
	GetStatus() *string
	GetRate() *int16
	GetComment() string
	GetCoverSize() domain.CoverSize

	Validate() error
}

type UpdateContentNoteCommand struct {
	ID        uuid.UUID
	Category  domain.ContentCategory
	Status    *string
	Rate      *int16
	Comment   string
	CoverSize domain.CoverSize
}

func (c *UpdateContentNoteCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.Rate, validation.NilOrNotEmpty, validation.Min(0), validation.Max(10)),
		validation.Field(&c.Comment, validation.Length(0, 1000)),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
	)
}

func (c *UpdateContentNoteCommand) GetID() uuid.UUID {
	return c.ID
}

func (c *UpdateContentNoteCommand) GetCategory() domain.ContentCategory {
	return c.Category
}

func (c *UpdateContentNoteCommand) GetStatus() *string {
	return c.Status
}

func (c *UpdateContentNoteCommand) GetRate() *int16 {
	return c.Rate
}

func (c *UpdateContentNoteCommand) GetComment() string {
	return c.Comment
}

func (c *UpdateContentNoteCommand) GetCoverSize() domain.CoverSize {
	return c.CoverSize
}

type GameNoteUpdateCommand struct {
	*UpdateContentNoteCommand
	LastPlayedAt *time.Time
}

func (c *GameNoteUpdateCommand) Validate() error {
	err := c.UpdateContentNoteCommand.Validate()
	if err != nil {
		return err
	}

	return validation.ValidateStruct(c,
		validation.Field(&c.LastPlayedAt, validation.NilOrNotEmpty),
	)
}

type MovieNoteUpdateCommand struct {
	*UpdateContentNoteCommand
	WatchedAt *time.Time
}

func (c *MovieNoteUpdateCommand) Validate() error {
	err := c.UpdateContentNoteCommand.Validate()
	if err != nil {
		return err
	}

	return validation.ValidateStruct(c,
		validation.Field(&c.WatchedAt, validation.NilOrNotEmpty),
	)
}

type GetSortedContentNotesByUserIDCommand struct {
	UserID                   uuid.UUID
	Category                 domain.ContentCategory
	Sort                     *domain.CursorSort
	Filters                  domain.Filters
	CoverSize                domain.CoverSize
	InitialOrdererAvatarSize domain.AvatarSize
}

func (c *GetSortedContentNotesByUserIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
		validation.Field(&c.InitialOrdererAvatarSize, validation.Required, is2.IsAvatarSize),
	)
}

type GetContentNoteByIDCommand struct {
	ID                       uuid.UUID
	Category                 domain.ContentCategory
	CoverSize                domain.CoverSize
	InitialOrdererAvatarSize domain.AvatarSize
}

func (c *GetContentNoteByIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.CoverSize, validation.Required, is2.IsCoverSize),
		validation.Field(&c.InitialOrdererAvatarSize, validation.Required, is2.IsAvatarSize),
	)
}

type DeleteContentNoteCommand struct {
	ID                  uuid.UUID
	UserID              uuid.UUID
	Category            domain.ContentCategory
	ResetApprovedOrders bool
}

func (c *DeleteContentNoteCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.UserID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
	)
}

type GetOrdersByContentNoteIDCommand struct {
	ID                uuid.UUID
	Category          domain.ContentCategory
	Pagination        *domain.Pagination
	OrdererAvatarSize domain.AvatarSize
}

func (c *GetOrdersByContentNoteIDCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.OrdererAvatarSize, validation.Required, is2.IsAvatarSize),
	)
}

type GetContentNoteReactionsBatchCommand struct {
	ContentNoteIDs uuid.UUIDs
	Category       domain.ContentCategory
}

func (c *GetContentNoteReactionsBatchCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ContentNoteIDs, validation.Required),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
	)
}

type AddContentNoteReactionCommand struct {
	ContentNoteID uuid.UUID
	Category      domain.ContentCategory
	EmoteID       string
	Source        string
}

func (c *AddContentNoteReactionCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ContentNoteID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.EmoteID, validation.Required, validation.Length(1, 50)),
		validation.Field(&c.Source, validation.Required, validation.Length(1, 16)),
	)
}

type RemoveContentNoteReactionCommand struct {
	ContentNoteID uuid.UUID
	Category      domain.ContentCategory
	EmoteID       string
	Source        string
}

func (c *RemoveContentNoteReactionCommand) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.ContentNoteID, validation.Required, is.UUID),
		validation.Field(&c.Category, validation.Required, is2.IsContentCategory),
		validation.Field(&c.EmoteID, validation.Required, validation.Length(1, 50)),
		validation.Field(&c.Source, validation.Required, validation.Length(1, 16)),
	)
}
