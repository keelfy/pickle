package utils

import (
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/pickle.pw/monolith/config"
)

func ParseJWTToken(tokenString string) (*jwt.Token, error) {
	secretKey := config.GetJWTSecret()

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

func VerifyJWTToken(tokenString string) error {
	token, err := ParseJWTToken(tokenString)
	if err != nil {
		return err
	}

	if !token.Valid {
		return fmt.Errorf("invalid token")
	}

	return nil
}

func ExtractJWTToken(r *http.Request) (*jwt.Token, error) {
	tokenString := r.Header.Get("Authorization")
	if len(tokenString) == 0 {
		return nil, fmt.Errorf("JWT token not found")
	}

	tokenString = tokenString[len("Bearer "):]
	return ParseJWTToken(tokenString)
}

func ExtractUserId(r *http.Request) (userId string, err error) {
	decodedToken, err := ExtractJWTToken(r)
	if err != nil {
		return "", err
	}
	userId, err = decodedToken.Claims.GetSubject()
	if err != nil {
		return "", err
	}

	return userId, nil
}
