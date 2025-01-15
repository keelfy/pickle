package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

func GetPort() string {
	return os.Getenv("PORT")
}

func IsDebug() bool {
	return os.Getenv("DEBUG") == "true"
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

func GetDatabaseURL() string {
	return os.Getenv("DATABASE_URL")
}

func GetRedisURL() string {
	return os.Getenv("REDIS_URL")
}

func GetElasticsearchUrls() []string {
	return strings.Split(os.Getenv("ELASTICSEARCH_URLS"), ";")
}

func GetElasticsearchUsername() string {
	return os.Getenv("ELASTICSEARCH_USERNAME")
}

func GetElasticsearchPassword() string {
	return os.Getenv("ELASTICSEARCH_PASSWORD")
}

func GetContextTimeoutMs() time.Duration {
	value, err := strconv.Atoi(os.Getenv("CONTEXT_TIMEOUT_MS"))
	if err != nil {
		log.Printf("Error parsing CONTEXT_TIMEOUT_MS: %v", err)
		return 1000 * 60 * time.Millisecond
	}
	return time.Duration(value) * time.Millisecond
}

func GetAvatarBucketName() string {
	return os.Getenv("AWS_S3_AVATAR_BUCKET_NAME")
}

func GetPreviewAvatarBucketName() string {
	return os.Getenv("AWS_S3_PREVIEW_AVATAR_BUCKET_NAME")
}

func GetApiKey() string {
	return os.Getenv("API_KEY")
}

func GetImgProxyUrl() string {
	return os.Getenv("IMGPROXY_URL")
}

func GetImgProxyKey() string {
	return os.Getenv("IMGPROXY_KEY")
}

func GetImgProxySalt() string {
	return os.Getenv("IMGPROXY_SALT")
}
