package services

import (
	"github.com/pickle.pw/monolith/internal/storage"
)

type StatusService interface {
	GetApiStatus() error
	GetS3Status() error
	GetSupabaseStatus() error
}

type statusService struct {
	supabase storage.SupabaseClient
	s3       storage.FileStorage
}

func NewStatusService(supabase storage.SupabaseClient, s3 storage.FileStorage) StatusService {
	return &statusService{
		supabase: supabase,
		s3:       s3,
	}
}

func (service *statusService) GetApiStatus() error {
	return nil
}

func (service *statusService) GetS3Status() error {
	return nil
}

func (service *statusService) GetSupabaseStatus() error {
	return nil
}
