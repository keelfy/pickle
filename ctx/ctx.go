package ctx

import (
	"github.com/pickle.pw/monolith/handlers"
	"github.com/pickle.pw/monolith/repo"
	"github.com/supabase-community/supabase-go"
)

type Context struct {
	Repo struct {
		Users     *repo.Users
		Orders    *repo.Orders
		Games     *repo.Games
		GameNotes *repo.GameNotes
	}

	Handler struct {
		Status   *handlers.Status
		User     *handlers.User
		Order    *handlers.Order
		Game     *handlers.Game
		GameNote *handlers.GameNote
	}
}

func NewContext(sb *supabase.Client) *Context {
	ctx := &Context{}

	// Repositories
	ctx.Repo.Users = repo.NewUserRepository(sb)
	ctx.Repo.Orders = repo.NewOrderRepository(sb)
	ctx.Repo.Games = repo.NewGameRepository(sb)
	ctx.Repo.GameNotes = repo.NewGameNoteRepository(sb)

	// Handler
	ctx.Handler.Status = handlers.NewStatusHandler()
	ctx.Handler.User = handlers.NewUserHandler(ctx.Repo.Users)
	ctx.Handler.Order = handlers.NewOrdersHandler(ctx.Repo.Users, ctx.Repo.Orders)
	ctx.Handler.Game = handlers.NewGamesHandler(ctx.Repo.Games)
	ctx.Handler.GameNote = handlers.NewGameNoteHandler(ctx.Repo.Users, ctx.Repo.GameNotes)

	return ctx
}
