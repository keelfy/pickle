package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/pickle.pw/monolith/internal/domain"
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

func GetContextTimeoutMs() time.Duration {
	value, err := strconv.Atoi(os.Getenv("CONTEXT_TIMEOUT_MS"))
	if err != nil {
		log.Printf("Error parsing CONTEXT_TIMEOUT_MS: %v", err)
		return 1000 * 60 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

/** Ory */

func GetOryUrl() string {
	return os.Getenv("ORY_URL")
}

/** JWT */

func GetJWTSecret() []byte {
	return []byte(os.Getenv("JWT_SECRET"))
}

/** DATABASE */

func GetDatabaseURL() string {
	return os.Getenv("DATABASE_URL")
}

/** REDIS */

func GetRedisURL() string {
	return os.Getenv("REDIS_URL")
}

/** ELASTICSEARCH */

func GetElasticsearchUrls() []string {
	return strings.Split(os.Getenv("ELASTICSEARCH_URLS"), ";")
}

func GetElasticsearchUsername() string {
	return os.Getenv("ELASTICSEARCH_USERNAME")
}

func GetElasticsearchPassword() string {
	return os.Getenv("ELASTICSEARCH_PASSWORD")
}

/** AWS S3 */

func GetAvatarBucketName() string {
	return os.Getenv("AWS_S3_AVATAR_BUCKET_NAME")
}

func GetContentPosterBucketName() string {
	return os.Getenv("AWS_S3_CONTENT_POSTER_BUCKET_NAME")
}

func GetMaxFileSizeBytes() int64 {
	mb, err := strconv.Atoi(os.Getenv("MAX_FILE_SIZE_MB"))
	if err != nil {
		log.Printf("Error parsing MAX_FILE_SIZE_MB: %v", err)
		mb = 5
	}
	return int64(mb << 20)
}

func GetPosterPreviewStoreTime() time.Duration {
	value, err := strconv.Atoi(os.Getenv("POSTER_PREVIEW_STORE_TIME_HOURS"))
	if err != nil {
		log.Printf("Error parsing POSTER_PREVIEW_STORE_TIME_HOURS: %v", err)
		return 24 * time.Hour
	}
	return time.Duration(value) * time.Hour
}

/** imgproxy */

func GetImgProxyUrl() string {
	return os.Getenv("IMGPROXY_URL")
}

func GetImgProxyKey() string {
	return os.Getenv("IMGPROXY_KEY")
}

func GetImgProxySalt() string {
	return os.Getenv("IMGPROXY_SALT")
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

func GetIGDBSyncItemsLimit() int {
	value, err := strconv.Atoi(os.Getenv("IGDB_SYNC_ITEMS_LIMIT"))
	if err != nil {
		log.Printf("Error parsing IGDB_SYNC_ITEMS_LIMIT: %v", err)
		return -1
	}
	return value
}

func GetIGDBRequestDelay() time.Duration {
	value, err := strconv.Atoi(os.Getenv("IGDB_REQUEST_DELAY_MS"))
	if err != nil {
		log.Printf("Error parsing IGDB_REQUEST_DELAY_MS: %v", err)
		return 100 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

func GetTMDBSyncItemsLimit() int {
	value, err := strconv.Atoi(os.Getenv("TMDB_SYNC_ITEMS_LIMIT"))
	if err != nil {
		log.Printf("Error parsing TMDB_SYNC_ITEMS_LIMIT: %v", err)
		return -1
	}
	return value
}

func GetTMDBRequestDelay() time.Duration {
	value, err := strconv.Atoi(os.Getenv("TMDB_REQUEST_DELAY_MS"))
	if err != nil {
		log.Printf("Error parsing TMDB_REQUEST_DELAY_MS: %v", err)
		return 100 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

func GetIGDBImageURLFormat() string {
	return os.Getenv("IGDB_IMAGE_URL_FORMAT")
}

/** TMDB */

func GetTMDBAPIKey() string {
	return os.Getenv("TMDB_API_KEY")
}

func GetTMDBBaseURL() string {
	return os.Getenv("TMDB_BASE_URL")
}

func GetTMDBImageBaseURL() string {
	return os.Getenv("TMDB_IMAGE_BASE_URL")
}

/** Order URL formats */

func GetOrderURLFormats() map[domain.OrdererSource]string {
	return map[domain.OrdererSource]string{
		domain.OrdererSourceInternal: os.Getenv("ORDERER_PICKLE_URL_FORMAT"),
		domain.OrdererSourceTwitch:   os.Getenv("ORDERER_TWITCH_URL_FORMAT"),
	}
}
