package is

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation"
	db "github.com/pickle.pw/monolith/db/sqlc"
)

var IsRFC3339Date = validation.Date(time.RFC3339)

var IsReactionSource = validation.In(
	db.ReactionSource7tv,
	db.ReactionSourceCustom,
	db.ReactionSourceUnicodeEmoji,
)

var IsOrderSource = validation.In(
	"twitch-channel-points",
	"suggestion",
	"manual",
)

var IsOrderStatus = validation.In(
	db.OrderStatusApproved,
	db.OrderStatusRejected,
)

var IsContentCategory = validation.In(
	db.ContentCategoryGames,
	db.ContentCategoryMovies,
	db.ContentCategorySeries,
	db.ContentCategoryAnime,
	db.ContentCategoryVideo,
)
