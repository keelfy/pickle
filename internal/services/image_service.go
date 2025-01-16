package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/errors"
)

type ImageService interface {
	ValidateImageBytes(imageFile []byte, fileSize int64) (string, error)
	ValidateMultipartImage(file multipart.File, fileHeader *multipart.FileHeader) error

	DownloadImageFile(ctx context.Context, url string) (data []byte, fileSize int64, err error)
	DownloadAndValidateImageFile(ctx context.Context, url string) ([]byte, string, error)

	SignImgProxyPath(path string) (signature string, err error)
	GetResizedImageUrl(imageUrl string, width, height int, cbTime *time.Time) (string, error)
	GetResizedImageUrlFromS3(bucketName, imageKey string, width, height int, cbTime *time.Time) (string, error)
}

type imageService struct {
}

func NewImageService() ImageService {
	return &imageService{}
}

var allowedExtensions = []string{
	".png",
	".jpg",
	".jpeg",
	".gif",
	".bmp",
	".webp",
}
var allowedMimeTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
	"image/webp": ".webp",
	"image/bmp":  ".bmp",
}
var imageDownloadClient = http.Client{
	Timeout: 5 * time.Second,
}

func (service *imageService) DownloadImageFile(ctx context.Context, url string) (data []byte, fileSize int64, err error) {
	resp, err := imageDownloadClient.Get(url)
	if err != nil {
		return nil, 0, errors.NewBadRequestError("Failed to download image", err)
	}
	defer resp.Body.Close()

	// Step 2: Limit the size of the response body
	limitedReader := io.LimitedReader{
		R: resp.Body,
		N: config.GetMaxFileSizeBytes() + 1, // Limit to maxFileSize bytes + 1 extra to detect oversized files
	}

	contentLength := resp.Header.Get("Content-Length")
	if contentLength == "" {
		return nil, 0, fmt.Errorf("Content-Length header is missing")
	}

	// Parse Content-Length to int64
	_, err = fmt.Sscanf(contentLength, "%d", &fileSize)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to parse Content-Length: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, 0, fmt.Errorf("received non-200 response: %d", resp.StatusCode)
	}

	// Read the limited response into a buffer
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(&limitedReader)
	if err != nil && err != io.EOF {
		return nil, 0, fmt.Errorf("failed to read image: %w", err)
	}

	// Check if the file size exceeds the limit
	if limitedReader.N <= 0 {
		return nil, 0, fmt.Errorf("file size exceeds the maximum allowed size")
	}

	return buf.Bytes(), fileSize, nil
}

func (service *imageService) validateImageFile(reader io.Reader, fileSize int64, fileName *string) (string, error) {
	maxFileSize := config.GetMaxFileSizeBytes()
	if fileSize > maxFileSize {
		return "", errors.NewBadRequestError(fmt.Sprintf("File size exceeds %dMB", maxFileSize/1024/1024), nil)
	}

	var ext string

	if fileName != nil {
		ext := filepath.Ext(*fileName)

		isAllowed := false
		for _, allowedExt := range allowedExtensions {
			if ext == allowedExt {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			return "", errors.NewBadRequestError("Invalid file extension: "+ext, nil)
		}
	}

	// Check MIME type
	buffer := make([]byte, 512)
	if _, err := reader.Read(buffer); err != nil {
		return "", errors.NewBadRequestError("Failed to read file", err)
	}

	mimeType := http.DetectContentType(buffer)

	isAllowedMimeType := false
	for allowedMimeType, extension := range allowedMimeTypes {
		if mimeType == allowedMimeType {
			isAllowedMimeType = true
			ext = extension
			break
		}
	}

	if !isAllowedMimeType {
		return "", errors.NewBadRequestError("Invalid MIME type: "+mimeType, nil)
	}

	fileExtension := ext[1:]
	if fileExtension == "jpg" && mimeType == "image/jpeg" {
		fileExtension = "jpeg"
	}

	if !strings.HasSuffix(mimeType, fileExtension) {
		return "", errors.NewBadRequestError("MIME type "+mimeType+" does not match file extension "+ext[1:], nil)
	}

	return ext, nil
}

func (service *imageService) ValidateImageBytes(imageFile []byte, fileSize int64) (string, error) {
	fileReader := bytes.NewReader(imageFile)
	return service.validateImageFile(fileReader, fileSize, nil)
}

func (service *imageService) ValidateMultipartImage(file multipart.File, fileHeader *multipart.FileHeader) error {
	if _, err := service.validateImageFile(file, fileHeader.Size, &fileHeader.Filename); err != nil {
		return err
	}

	// Reset file pointer to start (for further processing)
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return errors.NewBadRequestError("Failed to reset file pointer: %w", err)
	}

	return nil
}

func (service *imageService) DownloadAndValidateImageFile(ctx context.Context, url string) ([]byte, string, error) {
	imageFile, fileSize, err := service.DownloadImageFile(ctx, url)
	if err != nil {
		return nil, "", err
	}

	extension, err := service.ValidateImageBytes(imageFile, fileSize)
	if err != nil {
		return nil, "", err
	}

	return imageFile, extension, nil
}

func (service *imageService) SignImgProxyPath(path string) (signature string, err error) {
	var keyBin, saltBin []byte

	if keyBin, err = hex.DecodeString(config.GetImgProxyKey()); err != nil {
		return "", err
	}

	if saltBin, err = hex.DecodeString(config.GetImgProxySalt()); err != nil {
		return "", err
	}

	mac := hmac.New(sha256.New, keyBin)
	mac.Write(saltBin)
	mac.Write([]byte(path))
	signature = base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return signature, nil
}

func (service *imageService) GetResizedImageUrl(imageUrl string, width, height int, cbTime *time.Time) (string, error) {
	var cacheBusterKey *string

	if cbTime != nil {
		rfc3339 := cbTime.UTC().Format(time.RFC3339)
		safeRFC3339 := strings.ReplaceAll(rfc3339, ":", "") // prepare for HTTP
		cacheBusterKey = &safeRFC3339
	}

	encodedImageUrl := base64.RawURLEncoding.EncodeToString([]byte(imageUrl))

	path := fmt.Sprintf("/rs:auto:%v:%v:0/exar:t", width, height)
	if cacheBusterKey != nil {
		path = fmt.Sprintf("%s/cb:%v", path, *cacheBusterKey)
	}
	path = fmt.Sprintf("%s/%s", path, encodedImageUrl)

	signature, err := service.SignImgProxyPath(path)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s%s", config.GetImgProxyUrl(), signature, path), nil
}

func (service *imageService) GetResizedImageUrlFromS3(bucketName, imageKey string, width, height int, cbTime *time.Time) (string, error) {
	imageUrl := fmt.Sprintf("s3://%s/%s", bucketName, imageKey)
	return service.GetResizedImageUrl(imageUrl, width, height, cbTime)
}
