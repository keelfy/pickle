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

func GetContextTimeoutMs() time.Duration {
	value, err := strconv.Atoi(os.Getenv("CONTEXT_TIMEOUT_MS"))
	if err != nil {
		log.Printf("Error parsing CONTEXT_TIMEOUT_MS: %v", err)
		return 1000 * 60 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

/** SUPABASE */

func GetSupabaseUrl() string {
	return os.Getenv("SUPABASE_URL")
}

func GetSupabaseKey() string {
	return os.Getenv("SUPABASE_KEY")
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
