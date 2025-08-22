package presenter

import (
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/utils"
)

func PresentPaginatedResponse[T any](pagination *domain.Pagination, totalElements int64, content []T) *responses.Paginated[T] {
	return &responses.Paginated[T]{
		Page:          pagination.Page,
		Size:          pagination.Size,
		TotalPages:    utils.CalculateTotalPages(totalElements, pagination.Size),
		TotalElements: totalElements,
		Content:       content,
	}
}

func PresentPaginatedResponseWithCursor[T any](totalElements int64, content []T) *responses.CursorPaginated[T] {
	return &responses.CursorPaginated[T]{
		TotalElements: totalElements,
		Content:       content,
	}
}
