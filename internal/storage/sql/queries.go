package sql

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/pickle.pw/monolith/internal/domain"
)

type Queries interface {
	// Migrations
	FindElasticsearchMigrationByName(ctx context.Context, name string) (*domain.EsMigrationLog, error)
	InsertElasticsearchMigration(ctx context.Context, name string) error

	// User
	FindProfileByID(ctx context.Context, userID uuid.UUID) (*domain.DetailedUser, error)
	FindUserByUsername(ctx context.Context, username string) (*domain.User, error)
	FindDetailedUserByUsername(ctx context.Context, username string) (*domain.DetailedUser, error)
	UpdateProfileByUserID(ctx context.Context, arg UpdateProfileByUserIDParams) error
	UpdateProfileSuggestionPreferences(ctx context.Context, arg UpdateProfileSuggestionPreferencesParams) error
	InsertProfile(ctx context.Context, arg InsertProfileParams) (*domain.DetailedUser, error)
	GetUserFollows(ctx context.Context, followerID uuid.UUID) ([]*domain.DetailedUser, error)

	// User Avatar
	FindUserAvatarByUserID(ctx context.Context, userID uuid.UUID) (*domain.UserAvatar, error)
	InsertUserAvatar(ctx context.Context, arg InsertUserAvatarParams) (*domain.UserAvatar, error)
	UpdateUserAvatarByUserID(ctx context.Context, arg UpdateUserAvatarByUserIDParams) (*domain.UserAvatar, error)

	// Follower
	CountFollowers(ctx context.Context, userID uuid.UUID) (int64, error)
	DeleteFollower(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error
	InsertFollower(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) error
	IsFollowing(ctx context.Context, userID uuid.UUID, followerID uuid.UUID) (int64, error)

	// Moderator
	FindModeratorByUserIDAndModeratorID(ctx context.Context, userID, modUserID uuid.UUID) (*domain.Moderator, error)
	FindModeratorByUserIDAndModeratorIDAndNotDeleted(ctx context.Context, userID, modUserID uuid.UUID) (*domain.Moderator, error)
	FindModeratorsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Moderator, error)
	FindModeratorUsersByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.ModeratorUser, error)
	DeleteModeratorByUserIDAndModeratorID(ctx context.Context, deletedBy, userID, modUserID uuid.UUID) error
	InsertModerator(ctx context.Context, arg InsertModeratorParams) (*domain.Moderator, error)
	RevertModeratorByUserIDAndModeratorID(ctx context.Context, userID, modUserID uuid.UUID) error

	// Order
	FindOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error)
	FindOrderByIDWithOrderer(ctx context.Context, id uuid.UUID) (*domain.Order, error)
	CountOrdersByReceiverID(ctx context.Context, receiverID uuid.UUID) (int64, error)
	InsertOrder(ctx context.Context, arg InsertOrderParams) (*domain.Order, error)
	FindSortedOrdersByReceiverID(ctx context.Context, arg FindSortedOrdersByReceiverIDParams) ([]*domain.Order, error)
	FindPaginatedOrdersByContentNoteID(ctx context.Context, contentNoteID uuid.UUID, category domain.ContentCategory, sort *domain.Pagination) ([]*domain.Order, error)

	// Orderer
	FindOrdererByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error)
	FindOrdererWithUserByID(ctx context.Context, id uuid.UUID) (*domain.Orderer, error)
	FindOrdererByUserID(ctx context.Context, userID uuid.UUID) (*domain.Orderer, error)
	InsertOrdererManually(ctx context.Context, arg InsertOrdererManuallyParams) (*domain.Orderer, error)
	InsertReferencedOrderer(ctx context.Context, arg InsertReferencedOrdererParams) (*domain.Orderer, error)
	UpdateOrdererByUserID(ctx context.Context, arg UpdateOrdererByUserIDParams) error

	// Order Decision
	CancelOrderDecisionsByContentNoteID(ctx context.Context, arg CancelOrderDecisionsByContentNoteIDParams) error
	CountOrdersByContentNoteIDAndCategory(ctx context.Context, category domain.ContentCategory, contentNoteID uuid.UUID) (int64, error)
	InsertOrderDecision(ctx context.Context, arg InsertOrderDecisionParams) (*domain.OrderDecision, error)
	FindOrderDecisionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]*domain.OrderDecision, error)
	OrderDecisionExistsByOrderID(ctx context.Context, orderID uuid.UUID) (bool, error)

	// Content
	FindContentByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory, locale string) (domain.IContent, error)
	FindDetailedContentByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory, locale string) (domain.IDetailedContent, error)

	// Game
	UpsertGame(ctx context.Context, arg UpsertGameParams) (uuid.UUID, error)
	UpsertGameLocalization(ctx context.Context, arg UpsertGameLocalizationParams) error

	// Movie
	UpsertMovie(ctx context.Context, arg UpsertMovieParams) (uuid.UUID, error)
	UpsertMovieLocalization(ctx context.Context, arg UpsertMovieLocalizationParams) error

	// Content Note
	FindContentNoteByID(ctx context.Context, category domain.ContentCategory, noteID uuid.UUID, locale string) (domain.IContentNote, error)
	CheckIfContentNoteExistsByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID) (bool, error)
	FindContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID, locale string) (domain.IContentNote, error)
	FindDetailedContentNoteByID(ctx context.Context, id uuid.UUID, category domain.ContentCategory, locale string) (domain.IDetailedContentNote, error)
	FindDetailedContentNoteByContentID(ctx context.Context, category domain.ContentCategory, contentID uuid.UUID, userID uuid.UUID, locale string) (domain.IDetailedContentNote, error)
	DeleteContentNoteByID(ctx context.Context, category domain.ContentCategory, id uuid.UUID) error
	FindPaginatedContentNotesByUserID(ctx context.Context, params FindPaginatedContentNotesByUserIDParams) ([]domain.IDetailedContentNote, error)
	FindContentNoteIDsWithContentIDsByUserID(ctx context.Context, userID uuid.UUID) ([]*FindContentNoteIDsWithContentIDsByUserIDResult, error)

	// Poster Preview
	FindPosterPreviewByID(ctx context.Context, id uuid.UUID) (*domain.PosterPreview, error)
	FindPosterPreviewByCreatedAtAfterAndCreatedBy(ctx context.Context, arg FindPosterPreviewByCreatedAtAfterAndCreatedByParams) ([]*domain.PosterPreview, error)
	FindPosterPreviewByCreatedBy(ctx context.Context, createdBy uuid.UUID) ([]*domain.PosterPreview, error)
	InsertPosterPreview(ctx context.Context, arg InsertPosterPreviewParams) (*domain.PosterPreview, error)
	DeletePosterPreview(ctx context.Context, id uuid.UUID) error

	// Game Note
	InsertGameNote(ctx context.Context, arg InsertGameNoteParams) (*InsertGameNoteRow, error)
	UpdateGameNoteByID(ctx context.Context, arg UpdateGameNoteByIDParams) error
	CountPlayedGameNotesByUserID(ctx context.Context, userID uuid.UUID) (int64, error)

	// Movie Note
	InsertMovieNote(ctx context.Context, arg InsertMovieNoteParams) (*InsertMovieNoteRow, error)
	UpdateMovieNoteByID(ctx context.Context, arg UpdateMovieNoteByIDParams) error
	CountWatchedMovieNotesByUserID(ctx context.Context, userID uuid.UUID) (int64, error)

	// Content Note Reaction
	FindReactionsByContentNoteIDsInAndRequesterUserID(ctx context.Context, category domain.ContentCategory, contentNoteIDs uuid.UUIDs, requesterUserID *uuid.UUID) ([]*domain.ContentNoteReactionStack, error)
	CountReactionsByContentNoteIDAndUserID(ctx context.Context, category domain.ContentCategory, contentNoteID uuid.UUID, userID uuid.UUID) (int64, error)
	InsertContentNoteReaction(ctx context.Context, category domain.ContentCategory, arg *InsertContentNoteReactionParams) error
	DeleteContentNoteReaction(ctx context.Context, category domain.ContentCategory, arg *DeleteContentNoteReactionParams) error

	// Collection
	CountCollectionItemsByCollectionID(ctx context.Context, id uuid.UUID) (int64, error)
	DeleteCollectionByID(ctx context.Context, id uuid.UUID) error
	DeleteCollectionItemByID(ctx context.Context, id uuid.UUID) error
	DeleteCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) error
	InsertCollection(ctx context.Context, arg InsertCollectionParams) (*domain.Collection, error)
	UpdateCollectionByID(ctx context.Context, arg UpdateCollectionByIDParams) (*domain.Collection, error)
	InsertCollectionItem(ctx context.Context, arg InsertCollectionItemParams) (*domain.CollectionItem, error)
	FindCollectionByID(ctx context.Context, id uuid.UUID) (*domain.Collection, error)
	FindCollectionItemByID(ctx context.Context, id uuid.UUID) (*domain.CollectionItem, error)
	FindCollectionItemsByCollectionID(ctx context.Context, collectionID uuid.UUID) ([]*domain.CollectionItem, error)
	FindCollectionItemsByCollectionIDWithContent(ctx context.Context, collectionID uuid.UUID, locale string, pagination *domain.Pagination) ([]*domain.CollectionItem, error)
	FindCollectionItemsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.CollectionItem, error)
	FindCollectionItemsByUserIDWithContentLimitPerCollection(ctx context.Context, userID uuid.UUID, limit int16, locale string) ([]*domain.CollectionItem, error)
	FindCollectionsByUserID(ctx context.Context, userID uuid.UUID) ([]*domain.Collection, error)

	// External Sync Log
	CreateExternalSync(ctx context.Context, syncType domain.SyncType) (*domain.ExternalSyncLog, error)
	CompleteExternalSyncWithError(ctx context.Context, logID uuid.UUID, errorMessage string) error
	CompleteExternalSync(ctx context.Context, logID uuid.UUID, entitiesProcessed int64) error
	GetLastSuccessfulExternalSync(ctx context.Context, syncType domain.SyncType) (*domain.ExternalSyncLog, error)
	StartExternalSync(ctx context.Context, logID uuid.UUID) error
}

type queries struct {
	tx DBTX
}

type DBTX interface {
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
}

func New(pool *pgxpool.Pool) Queries {
	return &queries{
		tx: pool,
	}
}

func WithTx(tx pgx.Tx) Queries {
	return &queries{
		tx: tx,
	}
}
