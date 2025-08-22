package responses

import (
	"time"

	"github.com/google/uuid"
)

type Collection struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Name      string    `json:"name"`
}

type CollectionItem struct {
	ID           uuid.UUID `json:"id"`
	CreatedAt    time.Time `json:"createdAt"`
	CollectionID uuid.UUID `json:"collectionId"`
	Content      IContent  `json:"content"`
}

type BatchCollectionItems struct {
	*Paginated[*CollectionItem]
	CollectionID uuid.UUID `json:"collectionId"`
}
