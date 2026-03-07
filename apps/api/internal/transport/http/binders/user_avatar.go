package binders

import (
	"net/http"

	"github.com/pickle.pw/monolith/internal/commands"
	"github.com/pickle.pw/monolith/internal/config"
	"github.com/pickle.pw/monolith/internal/domain"
	"github.com/pickle.pw/monolith/internal/utils"
)

func BindGetMyAvatarURLCommand(r *http.Request) (*commands.GetUserAvatarURLCommand, error) {
	userID, err := utils.GetUserIDFromCtx(r.Context())
	if err != nil {
		return nil, err
	}

	avatarSize := domain.AvatarSize(BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeMedium)))
	return &commands.GetUserAvatarURLCommand{
		UserID:     userID,
		AvatarSize: avatarSize,
	}, nil
}

func BindGetUserAvatarURLCommand(r *http.Request) (*commands.GetUserAvatarURLCommand, error) {
	userID, err := BindPathVariableAsUUID(r, UserIDVariable)
	if err != nil {
		return nil, err
	}

	avatarSize := domain.AvatarSize(BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeMedium)))
	return &commands.GetUserAvatarURLCommand{
		UserID:     userID,
		AvatarSize: avatarSize,
	}, nil
}

func BindUploadAvatarForPreviewCommand(r *http.Request) (*commands.UploadAvatarForPreviewCommand, error) {
	userID, err := utils.GetUserIDFromCtx(r.Context())
	if err != nil {
		return nil, err
	}

	avatarSize := domain.AvatarSize(BindOptionalQueryParamAsString(r, AvatarSizeParam, string(domain.AvatarSizeLarge)))

	err = r.ParseMultipartForm(config.GetMaxFileSizeBytes())
	if err != nil {
		return nil, utils.NewBadRequestError("Unable to parse form", err)
	}

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		return nil, utils.NewBadRequestError("File is required", err)
	}
	defer file.Close()

	return &commands.UploadAvatarForPreviewCommand{
		UserID:     userID,
		File:       file,
		FileHeader: fileHeader,
		AvatarSize: avatarSize,
	}, nil
}
