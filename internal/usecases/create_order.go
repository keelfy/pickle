package usecases

import (
	"context"
	"slices"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
	"github.com/pickle.pw/monolith/internal/storage/sql"
	"github.com/pickle.pw/monolith/internal/utils"
	"go.uber.org/zap"
)

type CreateOrderUseCase interface {
	Handle(ctx context.Context, cmd *commands.CreateOrderCommand, ordererCmd *commands.CreateOrdererCommand) (*domain.Order, error)
}

type createOrderUseCase struct {
	sqlDb          storage.RelationalStorage
	userService    services.UserService
	orderService   services.OrderService
	ordererService services.OrdererService
	contentService services.ContentService
	ordersBroker   services.OrdersBrokerService
	logger         *zap.SugaredLogger
}

func NewCreateOrderUseCase(
	sqlDb storage.RelationalStorage,
	userService services.UserService,
	orderService services.OrderService,
	ordererService services.OrdererService,
	contentService services.ContentService,
	ordersBroker services.OrdersBrokerService, zapLogger *zap.SugaredLogger,
) CreateOrderUseCase {
	return &createOrderUseCase{
		sqlDb:          sqlDb,
		userService:    userService,
		orderService:   orderService,
		ordererService: ordererService,
		contentService: contentService,
		ordersBroker:   ordersBroker, logger: zapLogger,
	}
}

func (u *createOrderUseCase) Handle(ctx context.Context, cmd *commands.CreateOrderCommand, ordererCmd *commands.CreateOrdererCommand) (*domain.Order, error) {
	if err := cmd.Validate(); err != nil {
		return nil, utils.NewBadRequestError("invalid request", err)
	}

	receiver, err := u.userService.GetUserByID(ctx, cmd.ReceiverID)
	if err != nil {
		return nil, err
	}

	if err := u.validateReceiver(receiver, cmd); err != nil {
		return nil, err
	}

	if cmd.ContentID != nil {
		// check if content exists
		_, err = u.contentService.GetContentByID(ctx, cmd.Category, *cmd.ContentID)
		if err != nil {
			return nil, err
		}
	}

	var createdOrder *domain.Order

	err = u.sqlDb.BeginTx(ctx, func(tx sql.Queries) error {
		orderer, err := u.ordererService.CreateOrderer(ctx, tx, ordererCmd)
		if err != nil {
			return err
		}

		createdOrder, err = u.orderService.CreateOrder(ctx, tx, orderer.ID, cmd)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	u.ordersBroker.PublishOrder(createdOrder)
	return createdOrder, nil
}

func (u *createOrderUseCase) validateReceiver(receiver *domain.DetailedUser, cmd *commands.CreateOrderCommand) error {
	switch cmd.Source {
	case domain.OrderSourceTwitchChannelPoints:
		return nil
	case domain.OrderSourceSuggestion:
	case domain.OrderSourceManual:
		if receiver.SuggestionPreferences == nil {
			return utils.NewBadRequestError("receiver does not have suggestion preferences enabled", nil)
		}

		if !receiver.SuggestionPreferences.Enabled {
			return utils.NewBadRequestError("receiver does not have suggestion preferences enabled", nil)
		} else if !receiver.SuggestionPreferences.AllowedAnonymously && cmd.IsAnonymously {
			return utils.NewBadRequestError("you are not allowed to create an anonymous order for this profile", nil)
		} else if !slices.Contains(receiver.SuggestionPreferences.Categories, cmd.Category) {
			return utils.NewBadRequestError("you are not allowed to create an order for this category", nil)
		}
	}

	return nil
}
