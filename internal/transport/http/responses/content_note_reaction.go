package responses

import (
	"github.com/google/uuid"
)

type ContentNoteReaction struct {
	EmoteID     string `json:"emoteId"`
	Source      string `json:"source"`
	Count       int64  `json:"count"`
	UserReacted bool   `json:"userReacted"`
}

type ContentNoteReactions struct {
	ContentNoteID uuid.UUID              `json:"contentNoteId"`
	Reactions     []*ContentNoteReaction `json:"reactions"`
}
