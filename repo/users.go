package repo

import (
	"encoding/json"
	"log"

	"github.com/pickle.pw/monolith/models"
	"github.com/supabase-community/supabase-go"
)

type Users struct {
	sb *supabase.Client
}

func NewUserRepository(sb *supabase.Client) *Users {
	return &Users{sb: sb}
}

func (repo *Users) GetUserById(id string) (*models.User, error) {
	response, _, err := repo.sb.From("users").Select("*", "", false).Filter("user_id", "eq", id).Execute()
	if err != nil {
		log.Printf("Error fetching user data: %v", err)
		return nil, err
	}

	users := []models.User{}
	err = json.Unmarshal(response, &users)
	if err != nil {
		log.Printf("Error unmarshalling data: %v", err)
		return nil, err
	}

	if len(users) == 0 {
		return nil, nil
	}

	return &users[0], nil
}

func (repo *Users) GetUserByLink(link string) (*models.User, error) {
	response, _, err := repo.sb.From("users").Select("*", "", false).Filter("link", "eq", link).Single().Execute()
	if err != nil {
		log.Printf("Error fetching user data: %v", err)
		return nil, err
	}

	user := &models.User{}
	err = json.Unmarshal(response, user)
	if err != nil {
		log.Printf("Error unmarshalling data: %v", err)
		return nil, err
	}

	return user, nil
}
