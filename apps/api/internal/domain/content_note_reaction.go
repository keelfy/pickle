package domain

import (
	"github.com/google/uuid"
)

type ReactionSource = string

var (
	ReactionSourceUnicodeEmoji = "unicode_emoji"
	ReactionSourceCustom       = "custom"
)

type ContentNoteReactionStack struct {
	ContentNoteID uuid.UUID
	EmoteID       string
	Source        ReactionSource
	Count         int64
	UserReacted   bool
}
