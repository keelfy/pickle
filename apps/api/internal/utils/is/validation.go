package is

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation"
	"github.com/pickle.pw/monolith/internal/domain"
)

var IsRFC3339Date = validation.Date(time.RFC3339)

var IsReactionSource = validation.In(
	domain.ReactionSourceCustom,
	domain.ReactionSourceUnicodeEmoji,
)

var IsOrderSource = validation.In(
	domain.OrderSourceManual,
	domain.OrderSourceTwitchChannelPoints,
	domain.OrderSourceSuggestion,
)

var IsOrdererSource = validation.In(
	domain.OrdererSourceInternal,
	domain.OrdererSourceTwitch,
)

var IsOrderDecisionStatus = validation.In(
	domain.OrderDecisionStatusApproved,
	domain.OrderDecisionStatusRejected,
)

var IsContentCategory = validation.In(
	domain.ContentCategoryGames,
	domain.ContentCategoryMovies,
	domain.ContentCategorySeries,
	domain.ContentCategoryAnime,
	domain.ContentCategoryVideos,
)

var IsAvatarSize = validation.In(
	domain.AvatarSizeSmall,
	domain.AvatarSizeMedium,
	domain.AvatarSizeLarge,
)

var IsCoverSize = validation.In(
	domain.CoverSizeSmall,
	domain.CoverSizeMedium,
	domain.CoverSizeLarge,
	domain.CoverSizeThumbnailSmall,
	domain.CoverSizeThumbnailMedium,
)

var IsGameNoteStatus = validation.In(
	domain.GameNoteStatusDropped,
	domain.GameNoteStatusFinished,
	domain.GameNoteStatusPlaying,
	domain.GameNoteStatusPlanned,
	domain.GameNoteStatusSkipped,
	domain.GameNoteStatusPaused,
)

var IsMovieNoteStatus = validation.In(
	domain.MovieNoteStatusDropped,
	domain.MovieNoteStatusPlanned,
	domain.MovieNoteStatusSkipped,
	domain.MovieNoteStatusWatched,
)
