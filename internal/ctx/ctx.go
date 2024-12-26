package ctx

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pickle.pw/monolith/config"
	db "github.com/pickle.pw/monolith/db/sqlc"
	"github.com/pickle.pw/monolith/internal/handlers"
	"github.com/pickle.pw/monolith/internal/services"
	"github.com/pickle.pw/monolith/internal/storage"
)

type Context struct {
	S3Uploader struct {
		RawAvatar *storage.S3Uploader
	}

	Handler struct {
		Status   *handlers.Status
		User     *handlers.User
		Order    *handlers.Order
		GameNote *handlers.GameNote
	}

	Service struct {
		Status   *services.Status
		User     *services.User
		Order    *services.Order
		GameNote *services.GameNote
	}
}

func NewContext(pgxpool *pgxpool.Pool) *Context {
	ctx := &Context{}

	// Storage
	// sb := storage.InitSupabase()
	queries := db.New(pgxpool)

	// S3
	uploader, err := storage.NewS3Uploader(config.GetRawAvatarBucketName())
	if err != nil {
		panic(err)
	}
	ctx.S3Uploader.RawAvatar = uploader

	// Services
	ctx.Service.Status = services.NewStatusService(pgxpool)
	ctx.Service.User = services.NewUserService(queries, ctx.S3Uploader.RawAvatar)
	ctx.Service.Order = services.NewOrderService(pgxpool, queries, ctx.Service.User)
	ctx.Service.GameNote = services.NewGameNoteService(queries, ctx.Service.Order, ctx.Service.User)

	// Handler
	ctx.Handler.Status = handlers.NewStatusHandler(ctx.Service.Status)
	ctx.Handler.User = handlers.NewUserHandler(ctx.Service.User)
	ctx.Handler.Order = handlers.NewOrdersHandler(ctx.Service.Order, ctx.Service.User)
	ctx.Handler.GameNote = handlers.NewGameNoteHandler(ctx.Service.User, ctx.Service.GameNote)

	return ctx
}
