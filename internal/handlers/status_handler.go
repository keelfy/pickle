package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type StatusHandler interface {
	Health(w http.ResponseWriter, r *http.Request)
}

type statusHandler struct {
	sqlDb         storage.SQLDatabase
	elastic       storage.ElasticClient
	cache         storage.CacheClient
	statusService services.StatusService
}

func NewStatusHandler(sqlDb storage.SQLDatabase, elastic storage.ElasticClient, cache storage.CacheClient, statusService services.StatusService) StatusHandler {
	return &statusHandler{
		sqlDb:         sqlDb,
		elastic:       elastic,
		cache:         cache,
		statusService: statusService,
	}
}

// @Summary Get system health status
// @Description Get the health status of all system components including API, Database, Search, and Cache
// @Tags status
// @Accept json
// @Produce json
// @Success 200 {object} types.StatusRes
// @Failure 500 {object} types.StatusRes
// @Router /v1/health [get]
func (handler *statusHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	response := &types.StatusRes{
		API:      "OK",
		Database: "OK",
		Search:   "OK",
		Cache:    "OK",
	}
	statusCode := http.StatusOK

	err := handler.statusService.GetApiStatus()
	if err != nil {
		response.API = "ERROR"
		statusCode = http.StatusInternalServerError
	}

	err = handler.sqlDb.Ping(ctx)
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
		logger.Errorf(ctx, "Error writing data: %v", err)
	}
}
