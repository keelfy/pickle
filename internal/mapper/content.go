package mapper

import (
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/models/responses"
)

func MapIGDBWebsiteToContentWebsiteRes(website *models.IGDBWebsite) *responses.ContentWebsiteRes {
	return &responses.ContentWebsiteRes{
		URL:  website.URL,
		Type: website.Type.Type,
	}
}

func MapGameToGameRes(game *models.Game, coverURL *string) *responses.GameRes {
	websites := []responses.ContentWebsiteRes{}
	if game.Websites != nil && len(*game.Websites) > 0 {
		for _, website := range *game.Websites {
			websites = append(websites, *MapIGDBWebsiteToContentWebsiteRes(&website))
		}
	}

	return &responses.GameRes{
		ID:          game.ID,
		ExternalID:  game.ExternalID,
		Title:       game.Title,
		ReleaseDate: game.ReleaseDate,
		Websites:    websites,
		CoverURL:    coverURL,
		SourceURL:   game.SourceURL,
		SourceType:  game.SourceType,
	}
}

func MapMovieToMovieRes(movie *models.Movie, coverURL *string) *responses.MovieRes {
	websites := []responses.ContentWebsiteRes{}
	if movie.Websites != nil && len(*movie.Websites) > 0 {
		for _, website := range *movie.Websites {
			websites = append(websites, *MapIGDBWebsiteToContentWebsiteRes(&website))
		}
	}
	return &responses.MovieRes{
		ID:          movie.ID,
		ExternalID:  movie.ExternalID,
		Title:       movie.Title,
		ReleaseDate: movie.ReleaseDate,
		Websites:    websites,
		CoverURL:    coverURL,
		SourceURL:   movie.SourceURL,
		SourceType:  movie.SourceType,
	}
}
