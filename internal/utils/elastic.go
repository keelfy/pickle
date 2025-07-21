package utils

import (
	"encoding/json"

	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	"github.com/jinzhu/copier"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/types"
)

func ConvertElasticContentSearchResToRESTRes[T any](searchResponse *search.Response, pagination *types.Pagination) (*types.PaginatedRes[types.SearchHitRes[T]], error) {
	hits := []types.SearchHitRes[T]{}

	for _, hit := range searchResponse.Hits.Hits {
		rawSource := hit.Source_
		var (
			esSource types.EsContent
			source   types.SearchHitRes[T]
		)

		if err := json.Unmarshal(rawSource, &esSource); err != nil {
			return nil, errors.NewInternalServerError("Error occurred during content search", err)
		}

		source.Score = float64(*hit.Score_)
		copier.Copy(&source.Source, &esSource)
		hits = append(hits, source)
	}

	res := &types.PaginatedRes[types.SearchHitRes[T]]{
		Content:       hits,
		Page:          pagination.Page,
		Size:          pagination.Size,
		TotalPages:    searchResponse.Hits.Total.Value / int64(pagination.Size),
		TotalElements: searchResponse.Hits.Total.Value,
	}
	return res, nil
}
