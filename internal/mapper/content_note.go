package mapper

import (
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/models/responses"
)

func MapGameNoteToGameNoteRes(gameNote *models.GameNote, coverURL *string, ordererCount int64) *responses.GameNoteRes {
	content := MapGameToGameRes(gameNote.Content, coverURL)
	return &responses.GameNoteRes{
		ID:           gameNote.ID,
		CreatedAt:    gameNote.CreatedAt,
		UserID:       gameNote.UserID,
		Rate:         gameNote.Rate,
		Comment:      gameNote.Comment,
		Status:       gameNote.Status,
		Content:      content,
		LastPlayedAt: gameNote.LastPlayedAt,
		OrdererCount: ordererCount,
	}
}

func MapMovieNoteToMovieNoteRes(movieNote *models.MovieNote, coverURL *string, ordererCount int64) *responses.MovieNoteRes {
	content := MapMovieToMovieRes(movieNote.Content, coverURL)
	return &responses.MovieNoteRes{
		ID:           movieNote.ID,
		CreatedAt:    movieNote.CreatedAt,
		UserID:       movieNote.UserID,
		Rate:         movieNote.Rate,
		Comment:      movieNote.Comment,
		Status:       movieNote.Status,
		Content:      content,
		WatchedAt:    movieNote.WatchedAt,
		OrdererCount: ordererCount,
	}
}
