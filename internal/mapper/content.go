package mapper

import (
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/models/responses"
)

func MapIGDBWebsiteToContentWebsite(website *models.IGDBWebsite) *models.ContentWebsite {
	return &models.ContentWebsite{
		Trusted: website.Trusted,
		URL:     website.URL,
		Type:    website.Type.Type,
	}
}

func MapGameToGameRes(game *models.Game, coverURL *string) *responses.GameRes {
	return &responses.GameRes{
		BasicContentRes: responses.BasicContentRes{
			ID:         game.ID,
			ExternalID: game.ExternalID,
			Title:      game.Title,
			CoverURL:   coverURL,
			SourceURL:  game.SourceURL,
			SourceType: game.SourceType,
		},
		Websites:    game.Websites,
		ReleaseDate: game.ReleaseDate,
	}
}

func MapMovieToMovieRes(movie *models.Movie, coverURL *string) *responses.MovieRes {
	return &responses.MovieRes{
		BasicContentRes: responses.BasicContentRes{
			ID:         movie.ID,
			ExternalID: movie.ExternalID,
			Title:      movie.Title,
			CoverURL:   coverURL,
			SourceURL:  movie.SourceURL,
			SourceType: movie.SourceType,
		},
		Websites:    movie.Websites,
		ReleaseDate: movie.ReleaseDate,
	}
}
