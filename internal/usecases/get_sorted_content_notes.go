package usecases

import (
	"context"
	"sync"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/presenter"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
)

type GetSortedContentNotesByUserIDUseCase interface {
	Handle(ctx context.Context, cmd *commands.GetSortedContentNotesByUserIDCommand) ([]responses.IDetailedContentNote, error)
}

type getSortedContentNotesByUserIDUseCase struct {
	contentNoteService services.ContentNoteService
	contentService     services.ContentService
	avatarService      services.AvatarService
}

func NewGetSortedContentNotesByUserIDUseCase(
	contentNoteService services.ContentNoteService,
	contentService services.ContentService,
	avatarService services.AvatarService,
) GetSortedContentNotesByUserIDUseCase {
	return &getSortedContentNotesByUserIDUseCase{
		contentNoteService: contentNoteService,
		contentService:     contentService,
		avatarService:      avatarService,
	}
}

func (uc *getSortedContentNotesByUserIDUseCase) Handle(ctx context.Context, cmd *commands.GetSortedContentNotesByUserIDCommand) ([]responses.IDetailedContentNote, error) {
	contentNotes, err := uc.contentNoteService.GetFilteredSortedByReceiverID(ctx, cmd)
	if err != nil {
		return nil, err
	}

	additionalData := make([]*struct {
		NoteID             uuid.UUID
		CoverURL           *string
		InitialOrdererResp *responses.Orderer
	}, len(contentNotes))

	var wg sync.WaitGroup
	for i := range contentNotes {
		additionalData[i] = &struct {
			NoteID             uuid.UUID
			CoverURL           *string
			InitialOrdererResp *responses.Orderer
		}{
			NoteID: contentNotes[i].GetID(),
		}
		content := contentNotes[i].GetContent()

		wg.Add(1)
		go func() {
			additionalData[i].CoverURL = uc.contentService.GetContentCoverURL(ctx, content, cmd.CoverSize)
			wg.Done()
		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			orderer := contentNotes[i].GetInitialOrderer()
			var avatarURL string

			if orderer.UserID != nil {
				avatarURL, err = uc.avatarService.GetAvatarURLByUserID(ctx, *orderer.UserID, cmd.InitialOrdererAvatarSize)
				if err != nil {
					logger.Errorf(ctx, "failed to get avatar URL by user ID: %v", err)
				}
			}

			resp := presenter.PresentOrderer(orderer, avatarURL)
			additionalData[i].InitialOrdererResp = resp
		}()
	}

	wg.Wait()

	responses := make([]responses.IDetailedContentNote, len(contentNotes))

	for i := range contentNotes {
		res := presenter.PresentDetailedContentNote(contentNotes[i], additionalData[i].InitialOrdererResp, additionalData[i].CoverURL)
		responses[i] = res
	}

	return responses, nil
}
