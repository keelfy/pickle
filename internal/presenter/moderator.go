package presenter

import (
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentModerator(moderator *domain.ModeratorUser, avatarURL string) *resp.Moderator {
	return &resp.Moderator{
		ID:              moderator.Moderator.ID,
		ModeratorUserID: moderator.Moderator.ModeratorID,
		AddedAt:         moderator.Moderator.CreatedAt,
		UserID:          moderator.User.ID,
		Username:        moderator.User.Username,
		DisplayName:     moderator.User.DisplayName,
		AvatarURL:       avatarURL,
	}
}
