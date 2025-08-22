package presenter

import (
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentContentNoteReaction(reaction *domain.ContentNoteReactionStack) *responses.ContentNoteReaction {
	return &responses.ContentNoteReaction{
		EmoteID:     reaction.EmoteID,
		Source:      reaction.Source,
		Count:       reaction.Count,
		UserReacted: reaction.UserReacted,
	}
}

func PresentContentNoteReactions(reactions []*domain.ContentNoteReactionStack) []*responses.ContentNoteReaction {
	response := []*responses.ContentNoteReaction{}

	for _, reaction := range reactions {
		response = append(response, PresentContentNoteReaction(reaction))
	}

	return response
}

func PresentContentNoteReactionBatch(reactions []*domain.ContentNoteReactionStack) []*responses.ContentNoteReactions {
	response := []*responses.ContentNoteReactions{}

	reactionsMap := make(map[uuid.UUID][]*domain.ContentNoteReactionStack)
	for _, reaction := range reactions {
		reactionsMap[reaction.ContentNoteID] = append(reactionsMap[reaction.ContentNoteID], reaction)
	}

	for noteID, reactions := range reactionsMap {
		response = append(response, &responses.ContentNoteReactions{
			ContentNoteID: noteID,
			Reactions:     PresentContentNoteReactions(reactions),
		})
	}

	return response
}
