package types

import "time"

type PaginatedRes[T any] struct {
	Content       []T `json:"content"`
	Page          int `json:"page"`
	Size          int `json:"size"`
	TotalPages    int `json:"totalPages"`
	TotalElements int `json:"totalElements"`
}

type StatusRes struct {
	API      string `json:"api"`
	Database string `json:"database"`
}

type ProfileRes struct {
	UserID    string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Username  string    `json:"username"`
	Link      string    `json:"link"`
}

type GameNoteRes struct {
	ID               string    `json:"id"`
	CreatedAt        time.Time `json:"createdAt"`
	UserID           string    `json:"userId"`
	Name             string    `json:"name"`
	Link             string    `json:"link"`
	ReleaseDate      time.Time `json:"releaseDate"`
	Rate             int16     `json:"rate"`
	Comment          string    `json:"comment"`
	Ordered          bool      `json:"ordered"`
	Status           int16     `json:"status"`
	CompletionStatus int16     `json:"completionStatus"`
	CompletionDate   time.Time `json:"completionDate"`
}

type OrderRes struct {
	ID              string    `json:"id"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	UpdatedBy       string    `json:"updatedBy"`  // User ID
	ReceiverID      string    `json:"receiverId"` // User ID
	PaymentType     int16     `json:"paymentType"`
	Amount          float32   `json:"amount"`
	OrderedBy       string    `json:"orderedBy"` // User ID
	OrdererUsername string    `json:"ordererUsername"`
	Category        int16     `json:"categoryType"` // Category
	Message         string    `json:"message"`
	Status          int16     `json:"status"`
}

type LinkValidationRes struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}
