package mapper

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
)

func MapContentIDToMediaID(contentID uuid.UUID, category domain.ContentCategory) string {
	return fmt.Sprintf("%s:%s", category, contentID.String())
}

func MapMediaIDToContentID(mediaID string) (domain.ContentCategory, uuid.UUID, error) {
	parts := strings.Split(mediaID, ":")
	if len(parts) != 2 {
		return "", uuid.Nil, fmt.Errorf("invalid media ID: %s", mediaID)
	}

	contentID, err := uuid.Parse(parts[1])
	if err != nil {
		return "", uuid.Nil, fmt.Errorf("invalid content ID: %s", parts[1])
	}

	category := domain.ContentCategory(parts[0])
	return category, contentID, nil
}
