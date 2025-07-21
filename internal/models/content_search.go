package models

import (
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type ContentSearchResult interface {
	GetID() uuid.UUID
	GetTitle() string
	GetCoverKey() *string
	GetCoverKeyType() db.NullImageKeyType
	GetIsNoted() bool
}

type BasicContentSearchResult struct {
	ID           uuid.UUID           `json:"id"`
	Title        string              `json:"title,omitempty"`
	CoverKey     *string             `json:"coverKey,omitempty"`
	CoverKeyType db.NullImageKeyType `json:"coverKeyType,omitempty"`
	IsNoted      bool                `json:"isNoted"`
}

func (b *BasicContentSearchResult) GetID() uuid.UUID {
	return b.ID
}

func (b *BasicContentSearchResult) GetTitle() string {
	return b.Title
}

func (b *BasicContentSearchResult) GetCoverKey() *string {
	return b.CoverKey
}

func (b *BasicContentSearchResult) GetCoverKeyType() db.NullImageKeyType {
	return b.CoverKeyType
}

func (b *BasicContentSearchResult) GetIsNoted() bool {
	return b.IsNoted
}
