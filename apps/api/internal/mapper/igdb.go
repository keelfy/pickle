package mapper

import "github.com/pickle.pw/monolith/internal/domain"

func MapIGDBWebsiteToContentWebsite(website *domain.IGDBWebsite) *domain.ContentWebsite {
	return &domain.ContentWebsite{
		Trusted: website.Trusted,
		URL:     website.URL,
		Type:    website.Type.Type,
	}
}
