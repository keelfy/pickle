package models

import "time"

const (
	Playing   = "playing"
	Played    = "played"
	Planned   = "planned"
	Abandoned = "abandoned"
	OnHold    = "on_hold"
	Completed = "completed"
	Skipped   = "skipped"
	Banned    = "banned"
)

// Motivation
const (
	Motivation_Ordered = "ordered"
	Motivation_Desired = "desired"
)

type User struct {
	Id        string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Username  string    `json:"username"`
}

// Payment Type
const (
	PaymentType_TwitchPoints   = "twitch_points"
	PaymentType_DonationAlerts = "donation_alerts"
	PaymentType_DonatePay      = "donate_pay"
	PaymentType_StreamElements = "stream_elements"
	PaymentType_StreamLabs     = "stream_labs"
	PaymentType_Pickle         = "pickle"
)

// Order Status
const (
	OrderStatus_Approved  = "approved"
	OrderStatus_Denied    = "denied"
	OrderStatus_Reviewing = "reviewing"
)

const (
	Category_Custom = "custom"
	Category_Game   = "game"
	Category_Anime  = "anime"
	Category_Movie  = "movie"
	Category_Series = "series"
	Category_Video  = "video"
)

type Order struct {
	Id              int       `json:"id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	UpdatedBy       string    `json:"updated_by"`    // User ID
	Receiver        string    `json:"receiver"`      // User ID
	SerialNumber    int       `json:"serial_number"` // Number of a order for a user
	PaymentType     string    `json:"payment_type"`
	Amount          float32   `json:"amount"`
	OrderedBy       string    `json:"ordered_by"` // User ID
	OrdererUsername string    `json:"orderer_username"`
	CategoryType    string    `json:"category_type"` // Category
	Message         string    `json:"message"`
	Status          string    `json:"status"`
}

type OrderAction struct {
	Id              string    `json:"id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	UpdatedBy       string    `json:"updated_by"`
	ActionType      string    `json:"action_type"` // Approve / Deny / Review
	OrderId         int       `json:"order_id"`
	UpdatedMessage  string    `json:"updated_message"`
	UpdatedCategory string    `json:"updated_category"`
}

type Game struct {
	Id         string    `json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	Name       string    `json:"name"`
	Status     string    `json:"status"`
	URL        string    `json:"url"`
	Motivation string    `json:"motivation"`
}

type GameNote struct {
	Id         string    `json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	User       string    `json:"user"`
	GameName   string    `json:"game_name"`
	Rate       float32   `json:"rate"`
	Comment    string    `json:"comment"`
	Motivation string    `json:"motivation"`
	Status     string    `json:"status"`
	FinishedAt string    `json:"finished_at"`
}
