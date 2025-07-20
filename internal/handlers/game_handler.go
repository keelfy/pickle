package handlers

import (
	"net/http"

	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/logger"
	"github.com/pickle.pw/monolith/internal/mapper"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/utils"
)

type GameHandler interface {
	GetGameByID(w http.ResponseWriter, r *http.Request)
}

type gameHandler struct {
	gameService    services.GameService
	contentService services.ContentNoteService
}

func NewGameHandler(gameService services.GameService, contentService services.ContentNoteService) GameHandler {
	return &gameHandler{
		gameService:    gameService,
		contentService: contentService,
	}
}

// @Summary Get game by ID
// @Description Get game by ID
// @Tags games
// @Accept json
// @Produce json
// @Param id path string true "Game ID"
// @Param locale query string false "Locale"
// @Success 200 {object} any
// @Router /v1/games/{id} [get]
func (h *gameHandler) GetGameByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	locale := utils.GetQueryParam(r, "locale", "en")
	gameID, err := utils.ReadPathUUIDVariable("id", r)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	localizedGame, err := h.gameService.GetGameByIDWithLocalization(ctx, gameID, locale)
	if err != nil {
		utils.HttpError(ctx, err, w)
		return
	}

	coverSize := utils.GetQueryParam(r, "coverSize", "sm")
	var coverURL *string

	if localizedGame.CoverKey != nil && localizedGame.CoverKeyType.Valid {
		url, err := h.contentService.GetContentNoteCoverImageURL(ctx, db.ContentCategoryGames, coverSize, *localizedGame.CoverKey, localizedGame.CoverKeyType.ImageKeyType)
		if err != nil {
			logger.Errorf(ctx, "failed to get poster image URL for game %s: %v", gameID, err)
		} else {
			coverURL = &url
		}
	}

	res := mapper.MapGameToGameRes(localizedGame, coverURL)
	utils.WriteHttpJsonResponse(ctx, w, res)
}
