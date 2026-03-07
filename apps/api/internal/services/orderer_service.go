package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type OrdererService interface {
	GetOrdererByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error)
	GetOrdererWithUserByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error)
	CreateOrderer(ctx context.Context, qtx sql.Queries, cmd *commands.CreateOrdererCommand) (*domain.Orderer, error)
	UpdateOrdererDisplayNameByUserID(ctx context.Context, qtx sql.Queries, userID uuid.UUID, displayName string) error
}

type ordererService struct {
	sqlDb       storage.RelationalStorage
	userService UserService
	logger      *zap.SugaredLogger
}

func NewOrdererService(sqlDb storage.RelationalStorage, userService UserService, zapLogger *zap.SugaredLogger) OrdererService {
	return &ordererService{
		sqlDb:       sqlDb,
		userService: userService, logger: zapLogger,
	}
}

var ErrOrdererNotFound = utils.NewNotFoundError("orderer not found", nil)

func (s *ordererService) GetOrdererByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error) {
	orderer, err := s.sqlDb.Queries().FindOrdererByID(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, ErrOrdererNotFound
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to get orderer", err)
	}
	return orderer, nil
}

func (s *ordererService) GetOrdererWithUserByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error) {
	orderer, err := s.sqlDb.Queries().FindOrdererWithUserByID(ctx, id)
	if err == pgx.ErrNoRows {
		return nil, ErrOrdererNotFound
	} else if err != nil {
		return nil, utils.NewInternalServerError("failed to get orderer", err)
	}
	return orderer, nil
}

func (s *ordererService) CreateOrderer(ctx context.Context, qtx sql.Queries, cmd *commands.CreateOrdererCommand) (*domain.Orderer, error) {
	authUserID := utils.GetUserIDFromContextOrNil(ctx)

	var orderer *domain.Orderer
	var err error

	if cmd.Source == domain.OrdererSourceInternal {
		if cmd.UserID == nil {
			return nil, utils.NewInternalServerError("user ID is required for internal orderers", nil)
		}

		suggester, err := s.userService.GetUserByID(ctx, *cmd.UserID)
		if err != nil {
			return nil, err
		}

		orderer, err = qtx.InsertOrdererManually(ctx, sql.InsertOrdererManuallyParams{
			CreatedBy:   authUserID,
			DisplayName: suggester.DisplayName,
			UserID:      cmd.UserID,
			Source:      string(cmd.Source),
		})
	} else {
		if cmd.ReferenceUserID == nil {
			return nil, utils.NewInternalServerError("reference user ID is required for external orderers", nil)
		}

		orderer, err = qtx.InsertReferencedOrderer(ctx, sql.InsertReferencedOrdererParams{
			CreatedBy:       authUserID,
			UserID:          cmd.UserID,
			DisplayName:     cmd.DisplayName,
			Source:          string(cmd.Source),
			ReferenceUserID: *cmd.ReferenceUserID,
		})
	}

	if err != nil {
		return nil, utils.NewInternalServerError("failed to create orderer", err)
	}

	return orderer, nil
}

func (s *ordererService) UpdateOrdererDisplayNameByUserID(ctx context.Context, qtx sql.Queries, userID uuid.UUID, displayName string) error {
	authUserID, err := utils.GetUserIDFromCtx(ctx)
	if err != nil {
		return err
	}

	err = qtx.UpdateOrdererByUserID(ctx, sql.UpdateOrdererByUserIDParams{
		UserID:      userID,
		UpdatedBy:   &authUserID,
		DisplayName: displayName,
	})
	if err == pgx.ErrNoRows {
		return nil
	} else if err != nil {
		return utils.NewInternalServerError("failed to update orderer", err)
	}

	return nil
}
