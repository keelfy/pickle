package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/pickle.pw/monolith/config"
)

type Image struct {
	imgproxy struct {
		url  string
		key  string
		salt string
	}
}

func NewImageService() *Image {
	return &Image{
		imgproxy: struct {
			url  string
			key  string
			salt string
		}{
			url:  config.GetImgProxyUrl(),
			key:  config.GetImgProxyKey(),
			salt: config.GetImgProxySalt(),
		},
	}
}

func (service *Image) SignImgProxyPath(path string) (signature string, err error) {
	var keyBin, saltBin []byte

	if keyBin, err = hex.DecodeString(service.imgproxy.key); err != nil {
		return "", err
	}

	if saltBin, err = hex.DecodeString(service.imgproxy.salt); err != nil {
		return "", err
	}

	mac := hmac.New(sha256.New, keyBin)
	mac.Write(saltBin)
	mac.Write([]byte(path))
	signature = base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return signature, nil
}

func (service *Image) GetResizedImageUrl(imageUrl string, width, height int, updatedAt time.Time) (string, error) {
	cacheBusterKey := updatedAt.UTC().Format(time.RFC3339)
	cacheBusterKey = strings.ReplaceAll(cacheBusterKey, ":", "") // prepare for HTTP

	encodedImageUrl := base64.RawURLEncoding.EncodeToString([]byte(imageUrl))
	path := fmt.Sprintf("/rs:auto:%v:%v:0/cb:%v/%s", width, height, cacheBusterKey, encodedImageUrl)
	signature, err := service.SignImgProxyPath(path)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s%s", service.imgproxy.url, signature, path), nil
}

func (service *Image) GetResizedImageUrlFromS3(bucketName, imageKey string, width, height int, updatedAt time.Time) (string, error) {
	imageUrl := fmt.Sprintf("s3://%s/%s", bucketName, imageKey)
	return service.GetResizedImageUrl(imageUrl, width, height, updatedAt)
}
