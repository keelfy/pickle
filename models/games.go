package models

import "time"

type GameStatus string

type GameMotivation string

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

const (
	Ordered = "ordered"
	Desired = "desired"
)

type Game struct {
	Id         int            `json:"id"`
	CreatedAt  time.Time      `json:"created_at"`
	Name       string         `json:"name"`
	Status     GameStatus     `json:"status"`
	URL        string         `json:"url"`
	Motivation GameMotivation `json:"motivation"`
}

type GameOrder struct {
	Id        int       `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	Orderer   string    `json:"orderer_username"`
	Game      int       `json:"game"`
}
