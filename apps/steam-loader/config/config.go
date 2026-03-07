package config

import (
	"os"
)

func getOrDefault(name string, fallback string) string {
	value := os.Getenv(name)
	if len(value) == 0 {
		return fallback
	}
	return value
}

func GetPort() string {
	return os.Getenv("PORT")
}

func GetSupabaseUrl() string {
	return os.Getenv("SUPABASE_URL")
}

func GetSupabaseKey() string {
	return os.Getenv("SUPABASE_KEY")
}

func GetSteamAPIKey() string {
	return os.Getenv("STEAM_API_KEY")
}

func GetSteamAPIDomain() string {
	return getOrDefault("STEAM_API_DOMAIN", "api.steampowered.com")
}

func GetSteamAppListEndpoint() string {
	return getOrDefault("STEAM_APP_LIST_ENDPOINT", "/ISteamApps/GetAppList/v2")
}

func GetPostgresUrl() string {
	return os.Getenv("POSTGRES_URL")
}
