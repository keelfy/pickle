package models

import (
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

type Reaction struct {
	ContentNoteID uuid.UUID         `json:"noteId"`
	UserID        uuid.UUID         `json:"userId"`
	EmoteID       string            `json:"emoteId"`
	Source        db.ReactionSource `json:"source"`
}

type ReactionStack struct {
	ContentNoteID uuid.UUID         `json:"noteId"`
	EmoteID       string            `json:"emoteId"`
	Source        db.ReactionSource `json:"source"`
	Count         int64             `json:"count"`
	UserReacted   bool              `json:"userReacted"`
}
