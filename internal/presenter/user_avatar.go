package presenter

import (
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentUserAvatar(avatarURL string) *responses.UserAvatar {
	return &responses.UserAvatar{
		URL: avatarURL,
	}
}
