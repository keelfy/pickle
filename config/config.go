package config

import (
	"os"
)

func GetPort() string {
	return os.Getenv("PORT")
}

func GetSupabaseUrl() string {
	return os.Getenv("SUPABASE_URL")
}

func GetSupabaseKey() string {
	return os.Getenv("SUPABASE_KEY")
}

func GetJWTSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}
