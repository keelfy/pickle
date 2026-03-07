package presenter

import (
	"github.com/pickle.pw/monolith/internal/domain"
	resp "github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentProfileCounts(counts *domain.ProfileCounts) *resp.ProfileCounts {
	if counts == nil {
		return &resp.ProfileCounts{}
	}
	return &resp.ProfileCounts{
		Played:    counts.Played,
		Watched:   counts.Watched,
		Ordered:   counts.Ordered,
		Followers: counts.Followers,
	}
}

// PresentProfile transforms a domain.Profile to a transport response Profile.
func PresentProfile(u *domain.DetailedUser, profileCtx *domain.UserContext, counts *domain.ProfileCounts, avatarURL string) resp.Profile {
	user := PresentDetailedUser(u, profileCtx, avatarURL)
	countsResp := PresentProfileCounts(counts)
	return resp.Profile{
		DetailedUser: *user,
		CreatedAt:    u.CreatedAt,
		Counts:       *countsResp,
	}
}
