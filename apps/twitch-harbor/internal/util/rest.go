package util

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/google/uuid"
	"github.com/pickle-pw/twitch-harbor/internal/logger"
	"github.com/pickle-pw/twitch-harbor/internal/model"
)

const HeaderContentType = "Content-Type"
const ApplicationJsonType = "application/json"

func GetRequiredQueryParam(r *http.Request, key string) (string, error) {
	value := r.URL.Query().Get(key)
	if value == "" {
		return "", model.NewBadRequestError(fmt.Sprintf("Query parameter %v is required", key), nil)
	}

	decodedValue, err := url.QueryUnescape(value)
	if err != nil {
		return "", model.NewBadRequestError(fmt.Sprintf("Query parameter %v is invalid", key), err)
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

func LogAndWriteError(ctx context.Context, err error, w http.ResponseWriter) {
	model.LogCustomError(ctx, err)
	status := model.MapCustomErrorToHttpStatus(err)
	msg := err.Error()
	if msg == "" {
		msg = http.StatusText(status)
	}
	http.Error(w, msg, status)
}

func HttpError(ctx context.Context, err error, w http.ResponseWriter) {
	model.LogError(ctx, err)
	status := model.MapCustomErrorToHttpStatus(err)
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
		return "", model.NewBadRequestError(fmt.Sprintf("Path variable %v is required", name), nil)
	}

	return value, nil
}

// Returns UUID value of a variable or error if value is empty
func ReadPathUUIDVariable(name string, r *http.Request) (uuid.UUID, error) {
	value := r.PathValue(name)

	if len(value) == 0 {
		return uuid.Nil, model.NewBadRequestError(fmt.Sprintf("Path variable %v is required", name), nil)
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
		return uuid.Nil, model.NewBadRequestError("Value is not a valid UUID", err)
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
