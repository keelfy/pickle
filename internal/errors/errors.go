package errors

import (
	"log"
	"net/http"
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

func LogCustomError(err error) {
	if customErr, ok := err.(*CustomError); ok {
		log.Printf("%v: %v\n", customErr.Message, customErr.OriginalError)
	} else {
		log.Printf("Error: %v\n", err)
	}
}

func LogError(requestID string, err error) {
	if customErr, ok := err.(*CustomError); ok {
		log.Printf("[%v] %v: %v\n", requestID, customErr.Message, customErr.OriginalError)
	} else {
		log.Printf("[%v] Error: %v\n", requestID, err)
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
