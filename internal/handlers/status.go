package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/types"
	"github.com/pickle.pw/monolith/internal/utils"
)

type Status struct {
	statusService *services.Status
}

func NewStatusHandler(statusService *services.Status) *Status {
	return &Status{
		statusService: statusService,
	}
}

func (handler *Status) Health(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	response := &types.StatusRes{
		API:      "OK",
		Database: "OK",
	}
	statusCode := http.StatusOK

	err := handler.statusService.GetApiStatus()
	if err != nil {
		response.API = "ERROR"
		statusCode = http.StatusInternalServerError
	}

	err = handler.statusService.GetDatabaseStatus(ctx)
	if err != nil {
		response.Database = "ERROR"
		statusCode = http.StatusInternalServerError
	}

	w.Header().Set(utils.HeaderContentType, utils.ApplicationJsonType)
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error writing data: %v", err)
	}
}
