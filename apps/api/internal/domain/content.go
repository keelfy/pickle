package domain

import (
	"time"

	"github.com/google/uuid"
)

type ContentCategory string

const (
	ContentCategoryGames  ContentCategory = "games"
	ContentCategoryMovies ContentCategory = "movies"
	ContentCategorySeries ContentCategory = "series"
	ContentCategoryAnime  ContentCategory = "anime"
	ContentCategoryVideos ContentCategory = "videos"
	ContentCategoryCustom ContentCategory = "custom"
	ContentCategoryAny    ContentCategory = "any"
)

type ContentSource string

const (
	ContentSourceIGDB ContentSource = "igdb"
	ContentSourceTMDB ContentSource = "tmdb"
)

type ImageKeyType string

const (
	ImageKeyTypeIGDB   ImageKeyType = "igdb"
	ImageKeyTypeTMDB   ImageKeyType = "tmdb"
	ImageKeyTypeCustom ImageKeyType = "custom"
)

type CoverSize string

const (
	CoverSizeSmall           CoverSize = "sm"
	CoverSizeMedium          CoverSize = "md"
	CoverSizeLarge           CoverSize = "lg"
	CoverSizeThumbnailSmall  CoverSize = "tn_sm"
	CoverSizeThumbnailMedium CoverSize = "tn_md"
)

var CoverDimensions = map[CoverSize][]int{
	"sm":    {108, 144},
	"md":    {168, 224},
	"lg":    {336, 448},
	"tn_sm": {35, 35},
	"tn_md": {90, 90},
}

type ContentWebsite struct {
	Trusted bool
	URL     string
	Type    string
}

type IContent interface {
	GetID() uuid.UUID
	GetTitle() string
	GetCoverKey() *string
	GetCoverKeyType() *ImageKeyType
	GetCategory() ContentCategory
}

type ContentBase struct {
	ID           uuid.UUID
	Title        string
	Category     ContentCategory
	CoverKey     *string
	CoverKeyType *ImageKeyType
}

func (g *ContentBase) GetID() uuid.UUID {
	return g.ID
}

func (g *ContentBase) GetTitle() string {
	return g.Title
}

func (g *ContentBase) GetCategory() ContentCategory {
	return g.Category
}

func (g *ContentBase) GetCoverKey() *string {
	return g.CoverKey
}

func (g *ContentBase) GetCoverKeyType() *ImageKeyType {
	return g.CoverKeyType
}

type UserContent struct {
	*ContentBase
	NoteID *uuid.UUID
}

type IDetailedContent interface {
	IContent
	GetWebsites() []ContentWebsite
	GetSourceURL() *string
	GetSourceType() ContentSource
}

type DetailedContentBase struct {
	Websites   []ContentWebsite
	SourceURL  *string
	SourceType ContentSource
}

func (c *DetailedContentBase) GetWebsites() []ContentWebsite {
	return c.Websites
}

func (c *DetailedContentBase) GetSourceURL() *string {
	return c.SourceURL
}

func (c *DetailedContentBase) GetSourceType() ContentSource {
	return c.SourceType
}

type Game struct {
	*ContentBase
	ReleaseDate *time.Time
}

func (g *Game) GetCategory() ContentCategory {
	return ContentCategoryGames
}

type DetailedGame struct {
	*Game
	*DetailedContentBase
}

type Movie struct {
	*ContentBase
	ReleaseDate *time.Time
}

func (m *Movie) GetCategory() ContentCategory {
	return ContentCategoryMovies
}

type DetailedMovie struct {
	*Movie
	*DetailedContentBase
}
