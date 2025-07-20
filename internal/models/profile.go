package models

import (
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type Profile interface {
	GetID() uuid.UUID
	GetDisplayName() string
	GetUsername() string
	GetAvatarURL() string
}

type BasicProfile struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"displayName"`
	Username    string    `json:"username"`
	AvatarURL   string    `json:"avatarUrl"`
}

func (p *BasicProfile) GetID() uuid.UUID {
	return p.ID
}

func (p *BasicProfile) GetDisplayName() string {
	return p.DisplayName
}

func (p *BasicProfile) GetUsername() string {
	return p.Username
}

func (p *BasicProfile) GetAvatarURL() string {
	return p.AvatarURL
}

type PublicProfileCounts struct {
	Played    int64 `json:"played"`
	Watched   int64 `json:"watched"`
	Ordered   int64 `json:"ordered"`
	Followers int64 `json:"followers"`
}

type TwitchConnection struct {
	Connected bool   `json:"connected"`
	Login     string `json:"login,omitempty"`
}

type Connections struct {
	Twitch TwitchConnection `json:"twitch,omitempty"`
}

type PublicProfile struct {
	ID                    uuid.UUID              `json:"id"`
	DisplayName           string                 `json:"displayName"`
	Username              string                 `json:"username"`
	AvatarURL             string                 `json:"avatarUrl"`
	Description           string                 `json:"description"`
	Counts                PublicProfileCounts    `json:"counts"`
	IsFollowing           bool                   `json:"isFollowing"`
	IsAuthorized          bool                   `json:"isAuthorized"`
	SuggestionPreferences *SuggestionPreferences `json:"suggestionPreferences,omitempty"`
	Connections           *Connections           `json:"connections,omitempty"`
}

func (p *PublicProfile) GetID() uuid.UUID {
	return p.ID
}

func (p *PublicProfile) GetDisplayName() string {
	return p.DisplayName
}

func (p *PublicProfile) GetUsername() string {
	return p.Username
}

func (p *PublicProfile) GetAvatarURL() string {
	return p.AvatarURL
}

type ModeratorProfile struct {
	ID          uuid.UUID `json:"id"`
	AddedAt     time.Time `json:"addedAt"`
	DisplayName string    `json:"displayName"`
	Username    string    `json:"username"`
	AvatarURL   string    `json:"avatarUrl"`
}

func (p *ModeratorProfile) GetID() uuid.UUID {
	return p.ID
}

func (p *ModeratorProfile) GetDisplayName() string {
	return p.DisplayName
}

func (p *ModeratorProfile) GetUsername() string {
	return p.Username
}

func (p *ModeratorProfile) GetAvatarURL() string {
	return p.AvatarURL
}

type SuggestionPreferences struct {
	Enabled            bool                 `json:"enabled"`
	AllowedFree        bool                 `json:"allowedFree"`
	AllowedAnonymously bool                 `json:"allowedAnonymously"`
	Categories         []db.ContentCategory `json:"categories"`
}
