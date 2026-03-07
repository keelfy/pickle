package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

/** SYSTEM */

func GetPort() string {
	return os.Getenv("PORT")
}

func IsDebug() bool {
	return os.Getenv("DEBUG") == "true"
}

/** API */

func GetApiKey() string {
	return os.Getenv("API_KEY")
}

func GetAPIPrefix() string {
	return os.Getenv("API_PREFIX")
}

func GetContextTimeoutMs() time.Duration {
	value, err := strconv.Atoi(os.Getenv("CONTEXT_TIMEOUT_MS"))
	if err != nil {
		log.Printf("Error parsing CONTEXT_TIMEOUT_MS: %v", err)
		return 1000 * 60 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

/** Ory */

func GetOryAdminUrl() string {
	return os.Getenv("ORY_ADMIN_URL")
}

func GetOryPublicUrl() string {
	return os.Getenv("ORY_PUBLIC_URL")
}

/** DATABASE */

func GetDatabaseURL() string {
	return os.Getenv("DATABASE_URL")
}

/** CORS */

func GetCorsAllowedOrigins() []string {
	return strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ";")
}

/** Twitch */

func GetTwitchClientID() string {
	return os.Getenv("TWITCH_CLIENT_ID")
}

func GetTwitchClientSecret() string {
	return os.Getenv("TWITCH_CLIENT_SECRET")
}

func GetTwitchWebsocketSubscriptionsLimit() int {
	value, err := strconv.Atoi(os.Getenv("TWITCH_WEBSOCKET_SUBSCRIPTIONS_LIMIT"))
	if err != nil {
		log.Printf("Error parsing TWITCH_WEBSOCKET_SUBSCRIPTIONS_LIMIT: %v", err)
		return 300
	}
	return value
}

/** ORDER */

func GetOrderServiceUrl() string {
	return os.Getenv("ORDER_SERVICE_BASE_URL")
}

func GetCreateOrderEndpoint() string {
	return os.Getenv("CREATE_ORDER_ENDPOINT")
}

func GetCreateOrderEndpointMethod() string {
	return os.Getenv("CREATE_ORDER_ENDPOINT_METHOD")
}
