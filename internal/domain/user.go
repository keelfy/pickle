package domain

import (
	"time"

	"github.com/google/uuid"
)

type UserContext struct {
	IsFollowing  bool
	IsAuthorized bool
	IsModerator  bool
}

type IUser interface {
	GetID() uuid.UUID
	GetDisplayName() string
	GetUsername() string
}

type User struct {
	ID          uuid.UUID
	DisplayName string
	Username    string
}

func (u *User) GetID() uuid.UUID {
	return u.ID
}

func (u *User) GetDisplayName() string {
	return u.DisplayName
}

func (u *User) GetUsername() string {
	return u.Username
}

type DetailedUser struct {
	*User
	CreatedAt             time.Time
	UpdatedAt             time.Time
	UpdatedBy             *uuid.UUID
	Description           string
	Links                 []*ProfileLink
	SuggestionPreferences *SuggestionPreferences
}
