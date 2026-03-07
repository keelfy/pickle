package utils

import (
	"context"
	"net/http"

	"go.uber.org/zap"
)

// CustomError represents an error with an associated HTTP status code.
type CustomError struct {
	HttpStatus    int
	Message       string
	OriginalError error
}

func (e *CustomError) Error() string {
	return e.Message
}

func MapCustomErrorToHttpStatus(err error) int {
	if customErr, ok := err.(*CustomError); ok {
		return customErr.HttpStatus
	}
	// Default to 500 if the error is unknown
	return http.StatusInternalServerError
}

func ExtractErrorMessage(err error) string {
	if customErr, ok := err.(*CustomError); ok {
		if customErr.Message == "" && customErr.OriginalError != nil {
			return customErr.OriginalError.Error()
		}
		return customErr.Message
	}
	return err.Error()
}

// Deprecated: This function uses the global zap logger. It should be refactored
// to accept *zap.SugaredLogger as a parameter.
func LogCustomError(ctx context.Context, err error) {
	_ = ctx
	if customErr, ok := err.(*CustomError); ok {
		zap.S().Errorf("%v: %v", customErr.Message, customErr.OriginalError)
	} else {
		zap.S().Errorf("Error: %v", err)
	}
}

// Deprecated: This function uses the global zap logger. It should be refactored
// to accept *zap.SugaredLogger as a parameter.
func LogError(ctx context.Context, err error) {
	_ = ctx
	if customErr, ok := err.(*CustomError); ok {
		zap.S().Errorf("%v: %v\n", customErr.Message, customErr.OriginalError)
	} else {
		zap.S().Errorf("Error: %v\n", err)
	}
}

// Helper functions to create errors
func NewBadRequestError(msg string, err error) error {
	return &CustomError{HttpStatus: http.StatusBadRequest, Message: msg, OriginalError: err}
}

func NewNotFoundError(msg string, err error) error {
	return &CustomError{HttpStatus: http.StatusNotFound, Message: msg, OriginalError: err}
}

func NewUnauthorizedError(msg string, err error) error {
	return &CustomError{HttpStatus: http.StatusUnauthorized, Message: msg, OriginalError: err}
}

func NewForbiddenError(msg string, err error) error {
	return &CustomError{HttpStatus: http.StatusForbidden, Message: msg, OriginalError: err}
}

func NewInternalServerError(msg string, err error) error {
	return &CustomError{HttpStatus: http.StatusInternalServerError, Message: msg, OriginalError: err}
}

func NewConflictError(msg string, err error) error {
	return &CustomError{HttpStatus: http.StatusConflict, Message: msg, OriginalError: err}
}
