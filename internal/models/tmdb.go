package models

type TMDBMovie struct {
	ID                  int64                    `json:"id"`
	Title               string                   `json:"title"`
	OriginalTitle       string                   `json:"original_title"`
	Overview            string                   `json:"overview"`
	ReleaseDate         string                   `json:"release_date"`
	PosterPath          *string                  `json:"poster_path"`
	BackdropPath        *string                  `json:"backdrop_path"`
	Popularity          float64                  `json:"popularity"`
	VoteAverage         float64                  `json:"vote_average"`
	VoteCount           int64                    `json:"vote_count"`
	Adult               bool                     `json:"adult"`
	Video               bool                     `json:"video"`
	GenreIDs            []int64                  `json:"genre_ids"`
	OriginalLanguage    string                   `json:"original_language"`
	Homepage            *string                  `json:"homepage"`
	IMDBID              *string                  `json:"imdb_id"`
	Status              string                   `json:"status"`
	Runtime             *int64                   `json:"runtime"`
	Budget              *int64                   `json:"budget"`
	Revenue             *int64                   `json:"revenue"`
	Tagline             *string                  `json:"tagline"`
	SpokenLanguages     []TMDBSpokenLanguage     `json:"spoken_languages"`
	ProductionCompanies []TMDBProductionCompany  `json:"production_companies"`
	Translations        TMDBTranslationsResponse `json:"translations"`
}

type TMDBSpokenLanguage struct {
	ISO6391 string `json:"iso_639_1"`
	Name    string `json:"name"`
}

type TMDBProductionCompany struct {
	ID            int64   `json:"id"`
	Name          string  `json:"name"`
	LogoPath      *string `json:"logo_path"`
	OriginCountry string  `json:"origin_country"`
}

type TMDBTranslationsResponse struct {
	Translations []TMDBTranslation `json:"translations"`
}

type TMDBTranslation struct {
	ISO6391 string              `json:"iso_639_1"`
	Data    TMDBTranslationData `json:"data"`
}

type TMDBTranslationData struct {
	Title string `json:"title"`
}

type TMDBChangesResponse struct {
	Changes []TMDBChange `json:"changes"`
}

type TMDBChange struct {
	Key   string           `json:"key"`
	Items []TMDBChangeItem `json:"items"`
}

type TMDBChangeItem struct {
	ID            string `json:"id"`
	Action        string `json:"action"`
	Time          string `json:"time"`
	ISO6391       string `json:"iso_639_1"`
	ISO31661      string `json:"iso_3166_1"`
	Value         string `json:"value"`
	OriginalValue string `json:"original_value"`
}

type TMDBMovieChangesResponse struct {
	Results      []TMDBMovieChange `json:"results"`
	Page         int64             `json:"page"`
	TotalPages   int64             `json:"total_pages"`
	TotalResults int64             `json:"total_results"`
}

type TMDBMovieChange struct {
	ID         int64   `json:"id"`
	Adult      bool    `json:"adult"`
	Popularity float64 `json:"popularity"`
}

type TMDBMovieDiscoverResponse struct {
	Results      []TMDBMovie `json:"results"`
	Page         int64       `json:"page"`
	TotalPages   int64       `json:"total_pages"`
	TotalResults int64       `json:"total_results"`
}

var (
	TMDBWebsiteIMDB     = "imdb"
	TMDBWebsiteHomepage = "homepage"
)
