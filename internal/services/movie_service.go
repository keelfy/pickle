package services

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	db "github.com/pickle.pw/monolith/db/sqlc"
	cerrors "github.com/pickle.pw/monolith/internal/errors"
	"github.com/pickle.pw/monolith/internal/models"
	"github.com/pickle.pw/monolith/internal/storage"
)

type MovieService interface {
	GetMovieByIDWithLocalization(ctx context.Context, id uuid.UUID, lang string) (*models.Movie, error)
	GetMovieByID(ctx context.Context, id uuid.UUID) (*db.Movie, error)
}

type movieService struct {
	sqlDB storage.RelationalStorage
}

func NewMovieService(sqlDB storage.RelationalStorage) MovieService {
	return &movieService{
		sqlDB: sqlDB,
	}
}

func (s *movieService) GetMovieByID(ctx context.Context, id uuid.UUID) (*db.Movie, error) {
	movie, err := s.sqlDB.Queries().FindMovieByID(ctx, id)
	if err != nil {
		return nil, cerrors.NewInternalServerError("failed to fetch movie", err)
	}
	return movie, nil
}

func (s *movieService) GetMovieByIDWithLocalization(ctx context.Context, id uuid.UUID, lang string) (*models.Movie, error) {
	movie, err := s.sqlDB.Queries().FindMovieByIDWithLocalization(ctx, db.FindMovieByIDWithLocalizationParams{
		ID:   id,
		Lang: lang,
	})
	if err != nil {
		return nil, cerrors.NewInternalServerError("failed to fetch movie", err)
	}

	var websites []models.ContentWebsite
	if movie.Websites != nil {
		if err := json.Unmarshal(*movie.Websites, &websites); err != nil {
			return nil, cerrors.NewInternalServerError("failed to fetch websites", err)
		}
	}

	return &models.Movie{
		ID:           movie.ID,
		ExternalID:   movie.ExternalID,
		Title:        movie.Title,
		ReleaseDate:  movie.ReleaseDate,
		Websites:     websites,
		CoverKey:     movie.CoverKey,
		CoverKeyType: movie.CoverKeyType,
		SourceURL:    movie.SourceUrl,
		SourceType:   movie.SourceType,
	}, nil
}
