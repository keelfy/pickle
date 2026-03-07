package logger

import (
	"context"

	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"

	"github.com/pickle.pw/monolith/internal/config"
)

// NewLogger creates a new *zap.SugaredLogger configured for the current environment.
// When DEBUG=true, uses zap.NewDevelopment() (console encoder, debug level).
// Otherwise, uses zap.NewProduction() (JSON encoder, info level).
// This function is intended to be used as a Wire provider.
func NewLogger() (*zap.SugaredLogger, error) {
	var zapLogger *zap.Logger
	var err error

	if config.IsDebug() {
		zapLogger, err = zap.NewDevelopment()
	} else {
		zapLogger, err = zap.NewProduction()
	}
	if err != nil {
		return nil, err
	}

	return zapLogger.Sugar(), nil
}

// WithRequestID returns a new SugaredLogger with the chi request ID
// from the given context added as a "request_id" field.
// If no request ID is found in context, the logger is returned unchanged.
func WithRequestID(ctx context.Context, log *zap.SugaredLogger) *zap.SugaredLogger {
	if reqID := chiMiddleware.GetReqID(ctx); reqID != "" {
		return log.With("request_id", reqID)
	}

	return log
}
