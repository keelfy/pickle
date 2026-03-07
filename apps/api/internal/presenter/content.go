package presenter

import (
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentContentCategory(category domain.ContentCategory) string {
	return string(category)
}

func PresentContent(content domain.IContent, coverURL *string) resp.IContent {
	switch content := content.(type) {
	case *domain.Game:
		return PresentGame(content, coverURL)
	case *domain.Movie:
		return PresentMovie(content, coverURL)
	default:
		return presentContent(content, coverURL)
	}
}

func presentContent(content domain.IContent, coverURL *string) *resp.Content {
	return &resp.Content{
		ID:       content.GetID(),
		Title:    content.GetTitle(),
		CoverURL: coverURL,
		Category: PresentContentCategory(content.GetCategory()),
	}
}

func PresentUserContent(content *domain.UserContent, coverURL *string) *resp.UserContent {
	return &resp.UserContent{
		Content: presentContent(content.ContentBase, coverURL),
		NoteID:  content.NoteID,
	}
}

func PresentGame(game *domain.Game, coverURL *string) *resp.Game {
	content := presentContent(game, coverURL)
	return &resp.Game{
		Content:     content,
		ReleaseDate: game.ReleaseDate,
	}
}

func PresentMovie(movie *domain.Movie, coverURL *string) *resp.Movie {
	content := presentContent(movie, coverURL)
	return &resp.Movie{
		Content:     content,
		ReleaseDate: movie.ReleaseDate,
	}
}

func PresentDetailedContent(content domain.IDetailedContent, coverURL *string) resp.IDetailedContent {
	switch content := content.(type) {
	case *domain.DetailedGame:
		return PresentDetailedGame(content, coverURL)
	case *domain.DetailedMovie:
		return PresentDetailedMovie(content, coverURL)
	default:
		return presentDetailedContent(content, coverURL)
	}
}

func PresentContentSourceType(sourceType domain.ContentSource) string {
	return string(sourceType)
}

func presentDetailedContent(content domain.IDetailedContent, coverURL *string) *resp.DetailedContent {
	var sourceType *string
	if content.GetSourceType() != "" {
		st := PresentContentSourceType(content.GetSourceType())
		sourceType = &st
	}
	return &resp.DetailedContent{
		Content:    presentContent(content, coverURL),
		SourceURL:  content.GetSourceURL(),
		SourceType: sourceType,
		Websites:   PresentContentWebsites(content.GetWebsites()),
	}
}

func PresentContentWebsite(website domain.ContentWebsite) *resp.ContentWebsite {
	return &resp.ContentWebsite{
		Trusted: website.Trusted,
		URL:     website.URL,
		Type:    website.Type,
	}
}

func PresentContentWebsites(websites []domain.ContentWebsite) []*resp.ContentWebsite {
	websitesResp := make([]*resp.ContentWebsite, 0, len(websites))
	for _, website := range websites {
		websitesResp = append(websitesResp, PresentContentWebsite(website))
	}
	return websitesResp
}

func PresentDetailedGame(game *domain.DetailedGame, coverURL *string) *resp.DetailedGame {
	content := presentDetailedContent(game, coverURL)
	return &resp.DetailedGame{
		DetailedContent: content,
		ReleaseDate:     game.ReleaseDate,
	}
}

func PresentDetailedMovie(movie *domain.DetailedMovie, coverURL *string) *resp.DetailedMovie {
	content := presentDetailedContent(movie, coverURL)
	return &resp.DetailedMovie{
		DetailedContent: content,
		ReleaseDate:     movie.ReleaseDate,
	}
}
