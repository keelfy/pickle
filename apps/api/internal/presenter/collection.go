package presenter

import (
	"github.com/google/uuid"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/transport/http/responses"
)

func PresentCollection(collection *domain.Collection) *responses.Collection {
	return &responses.Collection{
		ID:        collection.ID,
		CreatedAt: collection.CreatedAt,
		Name:      collection.Name,
	}
}

func PresentCollectionItem(collectionItem *domain.CollectionItem, contentResp responses.IContent) *responses.CollectionItem {
	return &responses.CollectionItem{
		ID:           collectionItem.ID,
		CreatedAt:    collectionItem.CreatedAt,
		CollectionID: collectionItem.CollectionID,
		Content:      contentResp,
	}
}

func PresentCollectionItems(collectionItems []*domain.CollectionItem, coverURLs map[uuid.UUID]*string) []*responses.CollectionItem {
	items := make([]*responses.CollectionItem, len(collectionItems))
	for i, collectionItem := range collectionItems {
		coverURL := coverURLs[collectionItem.ContentID]
		contentResp := PresentContent(collectionItem.Content, coverURL)
		items[i] = PresentCollectionItem(collectionItem, contentResp)
	}
	return items
}

func PresentBatchCollectionItems(itemResponses []*responses.CollectionItem, pagination *domain.Pagination) *responses.BatchCollectionItems {
	paginated := PresentPaginatedResponse(pagination, int64(len(itemResponses)), itemResponses)
	return &responses.BatchCollectionItems{
		Paginated:    paginated,
		CollectionID: itemResponses[0].CollectionID,
	}
}
