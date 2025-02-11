package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
)

type ContentService interface {
	CreateOrderedContent(ctx context.Context, contentType db.ContentCategory, order *db.Order, orderer *db.Orderer, title string) (uuid.UUID, error)
	AttachOrderToContent(ctx context.Context, order *db.Order, contentID uuid.UUID, category db.ContentCategory) error
	GetContentPosterImageURL(ctx context.Context, category db.ContentCategory, size, imageKey string, cbTime time.Time) (string, error)
	GetContentPosterImageURL1(ctx context.Context, size string, content models.Content) (string, error)
	GetContentByID(ctx context.Context, id uuid.UUID, category db.ContentCategory) (models.Content, error)
}

type contentService struct {
	elastic              storage.ElasticStorage
	gameNoteService      GameNoteService
	gameNoteOrderService GameNoteOrderService
	posterService        PosterService
}

func NewContentService(elastic storage.ElasticStorage, gameNoteService GameNoteService, gameNoteOrderService GameNoteOrderService, posterService PosterService) ContentService {
	return &contentService{
		elastic:              elastic,
		gameNoteService:      gameNoteService,
		gameNoteOrderService: gameNoteOrderService,
		posterService:        posterService,
	}
}

func (service *contentService) CreateOrderedContent(ctx context.Context, contentType db.ContentCategory, order *db.Order, orderer *db.Orderer, title string) (uuid.UUID, error) {
	switch contentType {
	case db.ContentCategoryGames:
		gameNote, err := service.gameNoteService.CreateOrderedGameNote(ctx, order.ReceiverID, order, orderer, title)
		if err != nil {
			return uuid.Nil, err
		}

		return gameNote.ID, nil
	}

	return uuid.Nil, errors.New("invalid content type")
}

func (service *contentService) AttachOrderToContent(ctx context.Context, order *db.Order, contentID uuid.UUID, category db.ContentCategory) error {
	switch category {
	case db.ContentCategoryGames:
		return service.gameNoteOrderService.CreateGameNoteOrder(ctx, order.ReceiverID, order.ID, contentID)
	}

	return errors.New("invalid content type")
}

func (service *contentService) GetContentPosterImageURL(ctx context.Context, category db.ContentCategory, size, imageKey string, cbTime time.Time) (string, error) {
	switch category {
	case db.ContentCategoryGames:
		return service.posterService.GetPosterImageURL(ctx, "game-note", size, imageKey, cbTime)
	default:
		return "", errors.New("invalid content type")
	}
}

func (service *contentService) GetContentPosterImageURL1(ctx context.Context, size string, content models.Content) (string, error) {
	if content.GetPosterKey() == nil {
		return "", nil
	}

	switch content.GetCategory() {
	case db.ContentCategoryGames:
		return service.posterService.GetPosterImageURL(ctx, "game-note", size, *content.GetPosterKey(), content.GetPosterUpdatedAt())
	default:
		return "", errors.New("invalid content type")
	}
}

func (service *contentService) GetContentByID(ctx context.Context, id uuid.UUID, category db.ContentCategory) (models.Content, error) {
	switch category {
	case db.ContentCategoryGames:
		gameNote, err := service.gameNoteService.GetById(ctx, id)
		if err != nil {
			return nil, err
		}
		return &models.GameNote{GameNote: *gameNote}, nil
	default:
		return nil, errors.New("invalid content type")
	}
}
