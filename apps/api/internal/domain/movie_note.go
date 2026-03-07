package domain

import "time"

type MovieNoteStatus = string

var (
	MovieNoteStatusPlanned = "planned"
	MovieNoteStatusDropped = "dropped"
	MovieNoteStatusWatched = "watched"
	MovieNoteStatusSkipped = "skipped"
)

type DetailedMovieNote struct {
	*DetailedContentNote
	Status    MovieNoteStatus
	WatchedAt *time.Time
}

func (m *DetailedMovieNote) GetCategory() ContentCategory {
	return ContentCategoryMovies
}

func (m *DetailedMovieNote) GetStatus() string {
	return string(m.Status)
}
