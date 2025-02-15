package types

import "github.com/google/uuid"

type JWTToken struct {
	Id    string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type AuthUser struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
}

type Permission string

const (
	ModeratorPermission Permission = "moderator"
	OnlyOwnerPermission Permission = "only_owner"
	AnyonePermission    Permission = "anyone"
)
