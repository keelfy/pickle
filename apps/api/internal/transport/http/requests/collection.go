package requests

import (
	"github.com/google/uuid"
)

type CreateCollection struct {
	Name string `json:"name"`
}

type UpdateCollection struct {
	Name string `json:"name"`
}

type AddItemToCollection struct {
	ItemID   uuid.UUID `json:"itemId"`
	Category string    `json:"category"`
}
