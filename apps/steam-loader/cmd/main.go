package main

import (
	// autoload .env file

	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	_ "github.com/joho/godotenv/autoload"
	"github.com/pickle-pw/steam-loader/config"
)

type SteamApp struct {
	AppId int    `json:"appid"`
	Name  string `json:"name"`
}

type Game struct {
	Name    string `json:"name"`
	SteamId int    `json:"steam_id"`
	Source  string `json:"source"`
}

func main() {
	// Retrieve data from Steam API
	steamApps, err := extractSteamApps()
	if err != nil {
		log.Fatal("Error occurred during Steam apps extraction: ", err)
		return
	}

	log.Printf("Extracted %v apps from Steam", len(steamApps))

	// Remove duplicated AppIDs
	steamApps = removeDuplicateInt(steamApps)

	// Insert data to supabase
	if err := copyToStagingTable(steamApps); err != nil {
		log.Fatal("Error occurred during postgres insert: ", err)
		return
	}

	log.Printf("Data inserted")
}

func extractSteamApps() ([]SteamApp, error) {
	url := fmt.Sprintf("https://%v%v", config.GetSteamAPIDomain(), config.GetSteamAppListEndpoint())
	response, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	data := struct {
		AppList struct {
			Apps []SteamApp `json:"apps"`
		} `json:"applist"`
	}{}

	if err := json.NewDecoder(response.Body).Decode(&data); err != nil {
		return nil, err
	}

	return data.AppList.Apps, nil
}

func copyToStagingTable(apps []SteamApp) error {
	connStr := config.GetPostgresUrl()
	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		log.Fatal("Error connecting to the database: ", err)
		return err
	}
	defer conn.Close(context.Background())

	var buf [][]interface{}
	for _, app := range apps {
		buf = append(buf, []interface{}{
			app.Name,
			app.AppId,
			"Steam",
		})
	}

	if _, err := conn.Exec(context.Background(), "TRUNCATE staging_games;"); err != nil {
		log.Fatal("Error truncating staging table: ", err)
		return err
	}

	_, err = conn.CopyFrom(context.Background(), pgx.Identifier{"staging_games"}, []string{"name", "steam_id", "source"}, pgx.CopyFromRows(buf))
	if err != nil {
		log.Printf("Error occurred during staging table fulfillment: %v", err)
		return err
	}

	// Upsert data from staging table to main table
	_, err = conn.Exec(context.Background(), `
		INSERT INTO games (name, steam_id, source)
		SELECT name, steam_id, source
		FROM staging_games
		WHERE name IS NOT NULL AND name != '' AND steam_id IS NOT NULL
		ON CONFLICT (steam_id) DO NOTHING
		`)
	if err != nil {
		log.Fatal("Error upserting data into main table: ", err)
		return err
	}

	return nil
}

func removeDuplicateInt(intSlice []SteamApp) []SteamApp {
	allKeys := make(map[int]bool)
	list := []SteamApp{}
	for _, item := range intSlice {
		if _, value := allKeys[item.AppId]; !value {
			allKeys[item.AppId] = true
			list = append(list, item)
		} else {
			log.Printf("Duplicated AppId for %v", item.Name)
		}
	}
	return list
}
