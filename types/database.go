package types

import "time"

type InsertGameNote struct {
	User       string    `json:"user"`
	GameName   string    `json:"game_name"`
	Rate       float32   `json:"rate"`
	Comment    string    `json:"comment"`
	Ordered    bool      `json:"ordered"`
	Status     int       `json:"status"`
	FinishedAt time.Time `json:"finished_at"`
}
