package utils

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/errors"
)

type CursorSort struct {
	Cursor    interface{}
	Limit     int
	Column    string
	Direction string
}

const HeaderContentType = "Content-Type"
const ApplicationJsonType = "application/json"

func GetPagination(r *http.Request) (from, to, page, size int) {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		page = 0
	}

	size, err = strconv.Atoi(r.URL.Query().Get("size"))
	if err != nil {
		size = 20
	}

	if size > 100 {
		size = 100
	} else if size <= 0 {
		size = 1
	}

	from = page * size
	return from, from + size - 1, page, size
}

func GetSortedPagination(r *http.Request) (*CursorSort, error) {
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

	sort := &CursorSort{
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

func LogAndWriteError(err error, w http.ResponseWriter) {
	errors.LogCustomError(err)
	status := errors.MapCustomErrorToHttpStatus(err)
	msg := err.Error()
	if msg == "" {
		msg = http.StatusText(status)
	}
	http.Error(w, msg, status)
}

func HttpError(ctx context.Context, err error, w http.ResponseWriter) {
	reqId := chiMiddleware.GetReqID(ctx)
	errors.LogError(reqId, err)
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

	uid, err := uuid.Parse(value)
	if err != nil || uid == uuid.Nil {
		return uuid.Nil, errors.NewBadRequestError(fmt.Sprintf("Path variable %v is not a valid UUID", name), err)
	}

	return uid, nil
}
