package domain

import "time"

type GameNoteStatus = string

var (
	GameNoteStatusPlanned  = "planned"
	GameNoteStatusPlaying  = "playing"
	GameNoteStatusPaused   = "paused"
	GameNoteStatusDropped  = "dropped"
	GameNoteStatusFinished = "finished"
	GameNoteStatusSkipped  = "skipped"
)

type DetailedGameNote struct {
	*DetailedContentNote
	Status       GameNoteStatus
	LastPlayedAt *time.Time
}

func (d *DetailedGameNote) GetStatus() string {
	return string(d.Status)
}

func (g *DetailedGameNote) GetCategory() ContentCategory {
	return ContentCategoryGames
}
