package responses

import (
	"github.com/pickle.pw/monolith/internal/types"
)

type ContentSearchResultRes struct {
	Title        string  `json:"title,omitempty"`
	ThumbnailURL *string `json:"thumbnailUrl,omitempty"`
	IsNoted      bool    `json:"isNoted"`
}

type ContentSearchRes = types.PaginatedRes[types.SearchHitRes[ContentSearchResultRes]]
