package types

import "time"

type PaginatedRes[T any] struct {
	Content       []T `json:"content"`
	Page          int `json:"page"`
	Size          int `json:"size"`
	TotalPages    int `json:"totalPages"`
	TotalElements int `json:"totalElements"`
}

type UserDetailsRes struct {
	Id        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Username  string    `json:"username"`
}

type GameNoteRes struct {
	Id         int       `json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	User       string    `json:"user"`
	GameName   string    `json:"gameName"`
	Rate       float32   `json:"rate"`
	Comment    string    `json:"comment"`
	Ordered    bool      `json:"ordered"`
	Status     int       `json:"status"`
	FinishedAt string    `json:"finishedAt"`
}

type OrderRes struct {
	Id              int       `json:"id"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	UpdatedBy       string    `json:"updatedBy"`    // User ID
	Receiver        string    `json:"receiver"`     // User ID
	SerialNumber    int       `json:"serialNumber"` // Number of a order for a user
	PaymentType     string    `json:"paymentType"`
	Amount          float32   `json:"amount"`
	OrderedBy       string    `json:"orderedBy"` // User ID
	OrdererUsername string    `json:"ordererUsername"`
	CategoryType    string    `json:"categoryType"` // Category
	Message         string    `json:"message"`
	Status          string    `json:"status"`
}
