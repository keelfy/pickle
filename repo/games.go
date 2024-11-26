package repo

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/pickle.pw/monolith/models"
	"github.com/pickle.pw/monolith/storage"
	"github.com/supabase-community/supabase-go"
)

type Games struct {
	sb *supabase.Client
}

func NewGameRepository(sb *supabase.Client) *Games {
	return &Games{sb: sb}
}

const gamesTable = "games"

func (repo *Games) GetGames(from, to int) (*[]models.Game, error) {
	sb := storage.InitSupabase()
	bytes, _, err := sb.From(gamesTable).Select("*", "", false).Range(from, to, "").Execute()
	if err != nil {
		log.Printf("Error occurred during games fetch: %v", err)
		return nil, err
	}

	games := &[]models.Game{}
	err = json.Unmarshal(bytes[:], games)
	if err != nil {
		log.Printf("Error occurred during games parsing: %v", err)
		return nil, err
	}
	return games, nil
}

func (repo *Games) SearchForAGame(query string, from, to int) (*[]models.Game, error) {
	sb := storage.InitSupabase()

	query = strings.ReplaceAll(query, " ", "+")
	query = fmt.Sprintf("'%v:*'", query)
	bytes, _, err := sb.From(gamesTable).Select("*", "", false).TextSearch("name", query, "simple", "websearch").Range(from, to, "").Execute()
	if err != nil {
		log.Printf("Error occurred during games search: %v", err)
		return nil, err
	}

	games := &[]models.Game{}
	err = json.Unmarshal(bytes[:], games)
	if err != nil {
		log.Printf("Error occurred during games parsing: %v", err)
		return nil, err
	}
	return games, nil
}
