package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/storage"
)

type ContentService interface {
	CreateOrderedContent(ctx context.Context, contentType db.ContentCategory, order *db.Order, orderer *db.Orderer, title string) (uuid.UUID, error)
	AttachOrderToContent(ctx context.Context, order *db.Order, contentID uuid.UUID, category db.ContentCategory) error
}

type contentService struct {
	elastic              storage.ElasticStorage
	gameNoteService      GameNoteService
	gameNoteOrderService GameNoteOrderService
}

func NewContentService(elastic storage.ElasticStorage, gameNoteService GameNoteService, gameNoteOrderService GameNoteOrderService) ContentService {
	return &contentService{
		elastic:              elastic,
		gameNoteService:      gameNoteService,
		gameNoteOrderService: gameNoteOrderService,
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
