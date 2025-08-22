package presenter

import (
	"fmt"
	"strings"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

var orderURLFormats = config.GetOrderURLFormats()

func PresentOrdererURL(orderer *domain.Orderer) *string {
	if orderer == nil || orderer.Source == "" {
		return nil
	}

	format := orderURLFormats[orderer.Source]

	switch orderer.Source {
	case domain.OrdererSourceInternal:
		if orderer.User == nil {
			return nil
		}

		url := fmt.Sprintf(format, orderer.User.Username)
		return &url
	case domain.OrdererSourceTwitch:
		if orderer.DisplayName == "" {
			return nil
		}

		url := fmt.Sprintf(format, strings.ToLower(orderer.DisplayName))
		return &url
	default:
		return nil
	}
}

func PresentOrderer(orderer *domain.Orderer, avatarURL string) *resp.Orderer {
	ordererURL := PresentOrdererURL(orderer)
	return &resp.Orderer{
		ID:          orderer.ID,
		UserID:      orderer.UserID,
		DisplayName: orderer.DisplayName,
		Source:      string(orderer.Source),
		AvatarURL:   &avatarURL,
		URL:         ordererURL,
	}
}
