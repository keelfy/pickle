package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/types"
)

const HeaderContentType = "Content-Type"
const ApplicationJsonType = "application/json"

func GetRequiredQueryParam(r *http.Request, key string) (string, error) {
	value := r.URL.Query().Get(key)
	if value == "" {
		return "", errors.NewBadRequestError(fmt.Sprintf("Query parameter %v is required", key), nil)
	}

	decodedValue, err := url.QueryUnescape(value)
	if err != nil {
		return "", errors.NewBadRequestError(fmt.Sprintf("Query parameter %v is invalid", key), err)
	}

	return decodedValue, nil
}

func GetQueryParam(r *http.Request, key, defaultValue string) string {
	value := r.URL.Query().Get(key)
	if value == "" {
		return defaultValue
	}

	decodedValue, err := url.QueryUnescape(value)
	if err != nil {
		return defaultValue
	}
	return decodedValue
}

func GetQueryParamAsUUID(r *http.Request, key string) (uuid.UUID, error) {
	value := GetQueryParam(r, key, "")

	if value == "" {
		return uuid.Nil, nil
	}

	uid, err := ParseUUIDFromString(value)
	if err != nil {
		return uuid.Nil, err
	}
	return uid, nil
}

func GetQueryParamAsUUIDs(r *http.Request, key string) ([]uuid.UUID, error) {
	value := GetQueryParam(r, key, "")
	uuids := []uuid.UUID{}

	if value == "" {
		return uuids, nil
	}

	for _, id := range strings.Split(value, ",") {
		uid, err := ParseUUIDFromString(id)
		if err != nil {
			return uuids, err
		}
		uuids = append(uuids, uid)
	}
	return uuids, nil
}

func GetPagination(r *http.Request) (*types.Pagination, error) {
	page, err := strconv.Atoi(GetQueryParam(r, "page", "0"))
	if err != nil {
		page = 0
	}

	size, err := strconv.Atoi(GetQueryParam(r, "size", "10"))
	if err != nil || size <= 0 {
		size = 10
	}

	if size > 100 {
		size = 100
	} else if size <= 0 {
		size = 1
	}

	pagination := &types.Pagination{
		Size: size,
		Page: page,
		From: page * size,
	}

	return pagination, nil
}

func CalculateTotalPages(totalElements int64, size int) int64 {
	totalPages := totalElements / int64(size)
	if totalElements%int64(size) > 0 {
		totalPages++
	}
	return totalPages
}

func FillPaginatedResponse[T any](res []T, totalElements int64, pagination *types.Pagination) *types.PaginatedRes[T] {
	totalPages := CalculateTotalPages(totalElements, pagination.Size)
	return &types.PaginatedRes[T]{
		Content:       res,
		Page:          pagination.Page,
		Size:          pagination.Size,
		TotalPages:    totalPages,
		TotalElements: totalElements,
	}
}

func GetSortedPagination(r *http.Request) (*types.CursorSort, error) {
	limit, err := strconv.Atoi(GetQueryParam(r, "limit", "20"))
	if err != nil {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	} else if limit <= 0 {
		limit = 1
	}

	cursor, err := ParseCursor(r, "string")
	if err != nil {
		return nil, err
	}

	column := GetQueryParam(r, "column", "created_at")
	direction := GetQueryParam(r, "direction", "desc")

	sort := &types.CursorSort{
		Cursor:    cursor,
		Limit:     limit,
		Column:    column,
		Direction: direction,
	}
	return sort, nil
}

func GetFilters(r *http.Request) (types.Filters, error) {
	filters := make(types.Filters)
	param := GetQueryParam(r, "filters", "")
	if param == "" {
		return filters, nil
	}

	decodedParam, err := url.QueryUnescape(param)
	if err != nil {
		return nil, errors.NewBadRequestError("invalid filters: expected a valid URL-encoded string", err)
	}

	for _, filter := range strings.Split(decodedParam, ",") {
		parts := strings.Split(filter, ":")
		if len(parts) == 2 {
			filters[parts[0]] = parts[1]
		}
	}

	return filters, nil
}

// ParseCursor parses the cursor value from query parameters based on the expected column type.
func ParseCursor(r *http.Request, columnType string) (interface{}, error) {
	cursorParam := GetQueryParam(r, "cursor", "")
	if cursorParam == "" {
		return nil, nil // No cursor provided; handle this as the "first page" case
	}

	decodedCursorParam, err := url.QueryUnescape(cursorParam)
	if err != nil {
		return nil, errors.NewBadRequestError("invalid cursor: expected a valid URL-encoded string", err)
	}

	switch columnType {
	case "string":
		return decodedCursorParam, nil
	case "int":
		cursor, err := strconv.Atoi(decodedCursorParam)
		if err != nil {
			return nil, errors.NewBadRequestError("invalid cursor: expected an integer", err)
		}
		return cursor, nil
	case "float":
		cursor, err := strconv.ParseFloat(decodedCursorParam, 64)
		if err != nil {
			return nil, errors.NewBadRequestError("invalid cursor: expected a float", err)
		}
		return cursor, nil
	case "datetime":
		cursor, err := time.Parse(time.RFC3339, decodedCursorParam)
		if err != nil {
			return nil, errors.NewBadRequestError("invalid cursor: expected a datetime in RFC3339 format", err)
		}
		return cursor, nil
	default:
		return nil, errors.NewBadRequestError("unsupported column type", nil)
	}
}

func LogAndWriteError(ctx context.Context, err error, w http.ResponseWriter) {
	errors.LogCustomError(ctx, err)
	status := errors.MapCustomErrorToHttpStatus(err)
	msg := err.Error()
	if msg == "" {
		msg = http.StatusText(status)
	}
	http.Error(w, msg, status)
}

func HttpError(ctx context.Context, err error, w http.ResponseWriter) {
	errors.LogError(ctx, err)
	status := errors.MapCustomErrorToHttpStatus(err)
	msg := err.Error()
	if msg == "" {
		msg = http.StatusText(status)
	}
	http.Error(w, msg, status)
}

// Returns value of a variable or error if value is empty
func ReadPathVariable(name string, r *http.Request) (string, error) {
	value := r.PathValue(name)

	if len(value) == 0 {
		return "", errors.NewBadRequestError(fmt.Sprintf("Path variable %v is required", name), nil)
	}

	return value, nil
}

// Returns UUID value of a variable or error if value is empty
func ReadPathUUIDVariable(name string, r *http.Request) (uuid.UUID, error) {
	value := r.PathValue(name)

	if len(value) == 0 {
		return uuid.Nil, errors.NewBadRequestError(fmt.Sprintf("Path variable %v is required", name), nil)
	}

	uid, err := ParseUUIDFromString(value)
	if err != nil {
		return uuid.Nil, err
	}
	return uid, nil
}

func ParseUUIDFromString(value string) (uuid.UUID, error) {
	uid, err := uuid.Parse(value)
	if err != nil || uid == uuid.Nil {
		return uuid.Nil, errors.NewBadRequestError("Value is not a valid UUID", err)
	}

	return uid, nil
}

func WriteHttpJsonResponse[T any](ctx context.Context, w http.ResponseWriter, res T) {
	w.Header().Set(HeaderContentType, ApplicationJsonType)
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(res); err != nil {
		logger.Errorf(ctx, "Error data marshalling: %v", err)
	}
}
