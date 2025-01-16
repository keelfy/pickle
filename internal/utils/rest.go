package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
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
	return value, nil
}

func GetQueryParam(r *http.Request, key, defaultValue string) string {
	value := r.URL.Query().Get(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func GetPagination(r *http.Request) (*types.Pagination, error) {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		page = 0
	}

	size, err := strconv.Atoi(r.URL.Query().Get("size"))
	if err != nil {
		size = 20
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

func GetSortedPagination(r *http.Request) (*types.CursorSort, error) {
	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
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

	column := r.URL.Query().Get("column")
	if column == "" {
		column = "created_at"
	}

	direction := r.URL.Query().Get("direction")
	if direction == "" {
		direction = "asc"
	}

	sort := &types.CursorSort{
		Cursor:    cursor,
		Limit:     limit,
		Column:    column,
		Direction: direction,
	}
	return sort, nil
}

// ParseCursor parses the cursor value from query parameters based on the expected column type.
func ParseCursor(r *http.Request, columnType string) (interface{}, error) {
	cursorParam := r.URL.Query().Get("cursor")
	if cursorParam == "" {
		return nil, nil // No cursor provided; handle this as the "first page" case
	}

	switch columnType {
	case "string":
		return cursorParam, nil
	case "int":
		cursor, err := strconv.Atoi(cursorParam)
		if err != nil {
			return nil, errors.NewBadRequestError("invalid cursor: expected an integer", err)
		}
		return cursor, nil
	case "float":
		cursor, err := strconv.ParseFloat(cursorParam, 64)
		if err != nil {
			return nil, errors.NewBadRequestError("invalid cursor: expected a float", err)
		}
		return cursor, nil
	case "datetime":
		cursor, err := time.Parse(time.RFC3339, cursorParam)
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
