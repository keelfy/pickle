package binders

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	httpreq "github.com/pickle.pw/monolith/internal/transport/http/requests"
)

func BindGetContentNoteReactionsBatchCommand(r *http.Request) (*commands.GetContentNoteReactionsBatchCommand, error) {
	contentNoteIds, err := BindOptionalQueryParamAsUUIDs(r, "contentNoteIds")
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	return &commands.GetContentNoteReactionsBatchCommand{
		ContentNoteIDs: contentNoteIds,
		Category:       category,
	}, nil
}

func BindAddContentNoteReactionCommand(r *http.Request) (*commands.AddContentNoteReactionCommand, error) {
	contentNoteId, err := BindPathVariableAsUUID(r, "contentNoteId")
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	req := &httpreq.Reaction{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, err
	}

	return &commands.AddContentNoteReactionCommand{
		ContentNoteID: contentNoteId,
		Category:      category,
		EmoteID:       req.EmoteID,
		Source:        req.Source,
	}, nil
}

func BindRemoveContentNoteReactionCommand(r *http.Request) (*commands.RemoveContentNoteReactionCommand, error) {
	contentNoteId, err := BindPathVariableAsUUID(r, "contentNoteId")
	if err != nil {
		return nil, err
	}

	category, err := BindPathVariableAsContentVariable(r)
	if err != nil {
		return nil, err
	}

	req := &httpreq.Reaction{}
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		return nil, err
	}

	return &commands.RemoveContentNoteReactionCommand{
		ContentNoteID: contentNoteId,
		Category:      category,
		EmoteID:       req.EmoteID,
		Source:        req.Source,
	}, nil
}
