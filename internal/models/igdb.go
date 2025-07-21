package models

type IGDBPlatform struct {
	Name string `json:"name"`
}

type IGDBReleaseDate struct {
	Date     string       `json:"date"`
	Platform IGDBPlatform `json:"platform"`
}

type IGDBGame struct {
	ID               int64                  `json:"id"`
	Name             string                 `json:"name"`
	UpdatedAt        int64                  `json:"updated_at"`
	FirstReleaseDate *int64                 `json:"first_release_date"`
	ReleaseDates     *[]IGDBReleaseDate     `json:"release_dates"`
	URL              *string                `json:"url"`
	Websites         *[]IGDBWebsite         `json:"websites"`
	Cover            *IGDBCover             `json:"cover"`
	AlternativeNames *[]IGDBAlternativeName `json:"alternative_names"`
}

var (
	IGDBWebsiteSteamCategory     = 13
	IGDBWebsiteEpicGamesCategory = 14
)

type IGDBWebsite struct {
	Trusted bool            `json:"trusted"`
	URL     string          `json:"url"`
	Type    IGDBWebsiteType `json:"type"`
}

var (
	IGDBWebsiteTypeOfficial  = "official"
	IGDBWebsiteTypeEpicGames = "epicgames"
	IGDBWebsiteTypeSteam     = "steam"
	IGDBWebsiteTypeGog       = "gog"
	IGDBWebsiteTypeWikipedia = "wikipedia"
	IGDBWebsiteTypeTwitch    = "twitch"
	IGDBWebsiteTypeYoutube   = "youtube"
	IGDBWebsiteTypeTwitter   = "twitter"
	IGDBWebsiteTypeFacebook  = "facebook"
	IGDBWebsiteTypeInstagram = "instagram"
	IGDBWebsiteTypeReddit    = "reddit"
	IGDBWebsiteTypeDiscord   = "discord"
	IGDBWebsiteTypeWikia     = "wikia"
)

type IGDBWebsiteType struct {
	Type string `json:"type"`
}

type IGDBCover struct {
	ImageID *string `json:"image_id"`
	URL     string  `json:"url"`
}

type IGDBAlternativeName struct {
	Name    string `json:"name"`
	Comment string `json:"comment"`
}
