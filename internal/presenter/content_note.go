package presenter

import (
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentContentNote(contentNote domain.IContentNote, coverURL *string) resp.IContentNote {
	switch note := contentNote.(type) {
	case *domain.DetailedGameNote:
		return PresentGameNote(note, coverURL)
	case *domain.DetailedMovieNote:
		return PresentMovieNote(note, coverURL)
	default:
		return presentContentNote(contentNote, coverURL)
	}
}

func presentContentNote(contentNote domain.IContentNote, coverURL *string) *resp.ContentNote {
	contentResp := PresentContent(contentNote.GetContent(), coverURL)
	return &resp.ContentNote{
		ID:      contentNote.GetID(),
		UserID:  contentNote.GetUserID(),
		Content: contentResp,
	}
}

func PresentGameNote(contentNote domain.IContentNote, coverURL *string) *resp.GameNote {
	contentNoteResp := presentContentNote(contentNote, coverURL)
	content := PresentGame(contentNote.GetContent().(*domain.Game), coverURL)
	return &resp.GameNote{
		ContentNote: contentNoteResp,
		Content:     content,
	}
}

func PresentMovieNote(contentNote domain.IContentNote, coverURL *string) *resp.MovieNote {
	contentNoteResp := presentContentNote(contentNote, coverURL)
	content := PresentMovie(contentNote.GetContent().(*domain.Movie), coverURL)
	return &resp.MovieNote{
		ContentNote: contentNoteResp,
		Content:     content,
	}
}

func PresentCreateContentNoteCommandResult(result *commands.CreateContentNoteCommandResult) resp.IDetailedContentNote {
	initialOrdererResp := PresentOrderer(result.InitialOrderer, result.InitialOrdererAvatarURL)
	return PresentDetailedContentNote(result.DetailedContentNote, initialOrdererResp, result.CoverURL)
}

func PresentDetailedContentNote(
	contentNote domain.IDetailedContentNote,
	initialOrdererResp *resp.Orderer,
	coverURL *string,
) resp.IDetailedContentNote {
	switch contentNote := contentNote.(type) {
	case *domain.DetailedGameNote:
		return PresentDetailedGameNote(contentNote, initialOrdererResp, coverURL)
	case *domain.DetailedMovieNote:
		return PresentDetailedMovieNote(contentNote, initialOrdererResp, coverURL)
	default:
		return presentDetailedContentNote(contentNote, initialOrdererResp, coverURL)
	}
}

func presentDetailedContentNote(
	contentNote domain.IDetailedContentNote,
	initialOrdererResp *resp.Orderer,
	coverURL *string,
) *resp.DetailedContentNote {
	contentNoteResp := presentContentNote(contentNote, coverURL)
	return &resp.DetailedContentNote{
		ContentNote:    contentNoteResp,
		CreatedAt:      contentNote.GetCreatedAt(),
		Rate:           contentNote.GetRate(),
		Comment:        contentNote.GetComment(),
		Status:         contentNote.GetStatus(),
		OrdererCount:   contentNote.GetOrdererCount(),
		InitialOrderer: initialOrdererResp,
	}
}

func presentGameNoteAdditions(contentNote *domain.DetailedGameNote) *resp.GameNoteAdditions {
	return &resp.GameNoteAdditions{
		LastPlayedAt: contentNote.LastPlayedAt,
	}
}

func PresentDetailedGameNote(
	contentNote *domain.DetailedGameNote,
	initialOrdererResp *resp.Orderer,
	coverURL *string,
) *resp.DetailedGameNote {
	contentNoteResp := presentDetailedContentNote(contentNote, initialOrdererResp, coverURL)
	content := PresentDetailedGame(contentNote.Content.(*domain.DetailedGame), coverURL)
	return &resp.DetailedGameNote{
		DetailedContentNote: contentNoteResp,
		GameNoteAdditions:   presentGameNoteAdditions(contentNote),
		Content:             content,
	}
}

func presentMovieNoteAdditions(contentNote *domain.DetailedMovieNote) *resp.MovieNoteAdditions {
	return &resp.MovieNoteAdditions{
		WatchedAt: contentNote.WatchedAt,
	}
}

func PresentDetailedMovieNote(
	contentNote *domain.DetailedMovieNote,
	initialOrdererResp *resp.Orderer,
	coverURL *string,
) *resp.DetailedMovieNote {
	contentNoteResp := presentDetailedContentNote(contentNote, initialOrdererResp, coverURL)
	content := PresentDetailedMovie(contentNote.Content.(*domain.DetailedMovie), coverURL)
	return &resp.DetailedMovieNote{
		DetailedContentNote: contentNoteResp,
		MovieNoteAdditions:  presentMovieNoteAdditions(contentNote),
		Content:             content,
	}
}
