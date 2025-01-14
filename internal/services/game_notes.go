package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/types"
	"golang.org/x/sync/errgroup"
)

type GameNote struct {
	sqlDb                *storage.SQLDatabase
	esClient             *elasticsearch.TypedClient
	orderService         *Order
	userService          *Profile
	ordererService       *Orderer
	contentService       *Content
	gameNoteOrderService *GameNoteOrder
}

func NewGameNoteService(
	sqlDb *storage.SQLDatabase, es *elasticsearch.TypedClient,
	orderService *Order, userService *Profile, ordererService *Orderer, contentService *Content, gameNoteOrderService *GameNoteOrder) *GameNote {
	return &GameNote{
		sqlDb:                sqlDb,
		esClient:             es,
		orderService:         orderService,
		userService:          userService,
		ordererService:       ordererService,
		contentService:       contentService,
		gameNoteOrderService: gameNoteOrderService,
	}
}

func (service *GameNote) GetById(ctx context.Context, id uuid.UUID) (*db.GameNote, error) {
	gameNote, err := service.sqlDb.Queries.FindGameNoteById(ctx, id)
	if err != nil {
		return nil, errors.NewNotFoundError("Game note not found", err)
	}
	return gameNote, nil
}

// Fetches game notes by receiver ID or returns CustomError if error occurred
func (service *GameNote) GetByReceiverId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.GameNote, error) {
	gameNotes, err := service.findPaginatedGameNotesByUserId(ctx, userID, sort)
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game notes fetching", err)
	}

	return gameNotes, nil
}

const findPaginatedGameNotesByUserIdQuery = `SELECT * FROM "game_notes" WHERE "user_id" = $1 AND "%s" %s $2 ORDER BY "%s" %s LIMIT $3`

// Author: Egor Kuzmin (keelfy)
// Queries game notes by receiver id with cursor pagination and dynamic sorting
func (service *GameNote) findPaginatedGameNotesByUserId(ctx context.Context, userID uuid.UUID, sort *types.CursorSort) ([]*db.GameNote, error) {
	comparisonOperator := "<"
	if strings.ToUpper(sort.Direction) == "DESC" {
		comparisonOperator = ">"
	}

	query := fmt.Sprintf(findPaginatedGameNotesByUserIdQuery, sort.Column, comparisonOperator, strings.ToLower(sort.Column), strings.ToUpper(sort.Direction))
	rows, err := service.sqlDb.Conn.Query(ctx, query, userID, sort.Cursor, sort.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*db.GameNote
	for rows.Next() {
		var i db.GameNote
		if err := rows.Scan(
			&i.ID,
			&i.CreatedAt,
			&i.CreatedBy,
			&i.UpdatedAt,
			&i.UpdatedBy,
			&i.UserID,
			&i.GameID,
			&i.Name,
			&i.Link,
			&i.ReleaseDate,
			&i.Rate,
			&i.Comment,
			&i.Ordered,
			&i.Status,
			&i.LastPlayedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

// Creates game note and initial order (or approves existing) using user
// Validated inputs is expected
func (service *GameNote) CreateGameNote(ctx context.Context, req *types.CreateGameNoteReq, userId uuid.UUID) (*db.GameNote, error) {
	initialOrder, err := service.orderService.GetOrderById(ctx, req.InitialOrderId)
	if err != nil {
		return nil, err
	}

	initialOrderer, err := service.ordererService.GetOrdererById(ctx, initialOrder.OrdererID)
	if err != nil {
		return nil, err
	}

	order, err := service.orderService.UpdateOrderStatus(ctx, initialOrder, db.OrderStatusApproved, userId)
	if err != nil {
		return nil, err
	}

	// Insert new game note into database
	// TODO: Data validation before insertion, e.g. min-max rating or release date not after today
	gameNote, err := service.sqlDb.Queries.InsertGameNote(ctx, db.InsertGameNoteParams{
		CreatedBy:    userId,
		UpdatedBy:    userId,
		UserID:       order.ReceiverID,
		GameID:       nil, // TODO: Implement games
		Name:         req.GameNote.Name,
		Link:         req.GameNote.Link,
		ReleaseDate:  req.GameNote.ReleaseDate,
		Rate:         req.GameNote.Rate,
		Comment:      req.GameNote.Comment,
		Ordered:      true,
		Status:       req.GameNote.Status,
		LastPlayedAt: req.GameNote.LastPlayedAt,
	})
	if err != nil {
		return nil, errors.NewInternalServerError("Error occurred during game note creation", err)
	}

	// Create game note - order relation

	var g errgroup.Group

	g.Go(func() error {
		return service.gameNoteOrderService.CreateGameNoteOrder(ctx, userId, initialOrder.ID, gameNote.ID)
	})

	// Index documents in Elasticsearch

	g.Go(func() error {
		return service.IndexGameNote(ctx, gameNote, initialOrderer)
	})

	g.Go(func() error {
		return service.contentService.IndexContent(ctx, gameNote.ID, gameNote.Name, gameNote.UserID, db.ContentCategoryGames)
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return gameNote, nil
}

// Validates incoming data for #CreateGameNote func
func (service *GameNote) ValidateCreateGameNote(req *types.CreateGameNoteReq, userId uuid.UUID) error {
	// User is required
	if len(userId) == 0 {
		return errors.NewUnauthorizedError("Authentication is required", nil)
	}

	if len(req.InitialOrderId) == 0 {
		// Game note or order ID is a minimum
		if req.GameNote == nil {
			return errors.NewBadRequestError("Game or initial order ID is required", nil)
		}

		// Name is expected
		if len(req.GameNote.Name) == 0 {
			return errors.NewBadRequestError("Name of the game is required", nil)
		}
	}

	return nil
}

func (service *GameNote) IndexGameNote(ctx context.Context, gameNote *db.GameNote, initialOrderer *db.Orderer) error {
	document := &types.EsGameNote{
		ID:          gameNote.ID,
		Name:        gameNote.Name,
		UserID:      gameNote.UserID,
		OrdererName: initialOrderer.Username,
		RequestDate: gameNote.CreatedAt,
		Status:      gameNote.Status,
	}
	_, err := service.esClient.Index("game_notes").Document(document).Do(ctx)
	if err != nil {
		return errors.NewInternalServerError("Error occurred during game note indexing", err)
	}
	return nil
}
