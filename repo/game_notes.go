package repo

import (
	"encoding/json"
	"log"

	"github.com/pickle.pw/monolith/models"
	"github.com/pickle.pw/monolith/types"
	"github.com/supabase-community/supabase-go"
)

type GameNotes struct {
	sb *supabase.Client
}

func NewGameNoteRepository(sb *supabase.Client) *GameNotes {
	return &GameNotes{sb: sb}
}

const tableName = "game_notes"

func (repo *GameNotes) CreateGameNote(req *types.InsertGameNote) (*models.GameNote, error) {
	bytes, _, err := repo.sb.From(tableName).Insert(req, false, "", "representation", "").Execute()
	if err != nil {
		log.Printf("Error game note creation: %v", err)
		return nil, err
	}

	notes := []models.GameNote{}
	err = json.Unmarshal(bytes[:], &notes)
	if err != nil {
		log.Printf("Error game note parsing: %v", err)
		return nil, err
	}
	return &notes[0], nil
}

func (repo *GameNotes) GetGameNotesByUserId(id string) (*[]models.GameNote, error) {
	bytes, _, err := repo.sb.From(tableName).Select("*", "", false).Filter("user", "eq", id).Execute()
	if err != nil {
		log.Printf("Error game notes searching: %v", err)
		return nil, err
	}

	notes := &[]models.GameNote{}
	err = json.Unmarshal(bytes[:], notes)
	if err != nil {
		log.Printf("Error unmarshalling: %v", err)
		return nil, err
	}

	return notes, nil
}
