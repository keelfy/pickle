package types

import (
	"time"
)

type CreateGameNoteReq struct {
	GameName   string    `json:"gameName"`
	Rate       float32   `json:"rate"`
	Comment    string    `json:"comment"`
	Ordered    bool      `json:"ordered"`
	Status     int       `json:"status"`
	FinishedAt time.Time `json:"finishedAt"`
}
