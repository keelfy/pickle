package types

type JWTToken struct {
	Id    string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
}
