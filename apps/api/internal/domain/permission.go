package domain

type Permission string

const (
	ModeratorPermission Permission = "moderator"
	OnlyOwnerPermission Permission = "only_owner"
	AnyonePermission    Permission = "anyone"
)
