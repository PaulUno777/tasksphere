package jwt

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

var accessSecret = []byte("access-secret")
var refreshSecret = []byte("refresh-secret")

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateTokens(userID, email string) TokenPair {
	accessToken := generateToken(userID, email, accessSecret, 15*time.Minute)
	refreshToken := generateToken(userID, email, refreshSecret, 7*24*time.Hour)
	return TokenPair{accessToken, refreshToken}
}

func generateToken(userID, email string, secret []byte, duration time.Duration) string {
	claims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString(secret)
	return signed
}

func VerifyAccessToken(tokenStr string) (*Claims, error) {
	return verifyToken(tokenStr, accessSecret)
}

func VerifyRefreshToken(tokenStr string) (*Claims, error) {
	return verifyToken(tokenStr, refreshSecret)
}

func verifyToken(tokenStr string, secret []byte) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, jwt.ErrInvalidKey
}
