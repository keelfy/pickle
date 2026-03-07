package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type StatusHandler interface {
	Health(w http.ResponseWriter, r *http.Request)
}

type statusHandler struct {
	sqlDb   storage.RelationalStorage
	elastic storage.ElasticStorage
	cache   storage.CacheStorage
	logger  *zap.SugaredLogger
}

func NewStatusHandler(sqlDb storage.RelationalStorage, elastic storage.ElasticStorage, cache storage.CacheStorage, zapLogger *zap.SugaredLogger) StatusHandler {
	return &statusHandler{
		sqlDb:   sqlDb,
		elastic: elastic,
		cache:   cache, logger: zapLogger,
	}
}

// @Summary Get system health status
// @Description Get the health status of all system components including API, Database, Search, and Cache
// @Tags status
// @Accept json
// @Produce json
// @Success 200 {object} responses.StatusRes
// @Failure 500 {object} responses.StatusRes
// @Router /v1/health [get]
func (handler *statusHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	response := &responses.StatusRes{
		API:      "OK",
		Database: "OK",
		Search:   "OK",
		Cache:    "OK",
	}
	statusCode := http.StatusOK

	err := handler.sqlDb.Ping(ctx)
	if err != nil {
		response.Database = "ERROR"
		statusCode = http.StatusInternalServerError
	}

	err = handler.elastic.Ping(ctx)
	if err != nil {
		response.Search = "ERROR"
		statusCode = http.StatusInternalServerError
	}

	err = handler.cache.Ping(ctx)
	if err != nil {
		response.Cache = "ERROR"
		statusCode = http.StatusInternalServerError
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		logger.WithRequestID(ctx, handler.logger).Errorf("Error writing data: %v", err)
	}
}
