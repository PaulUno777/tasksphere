package services

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type TokenClaims struct {
	UserID    bson.ObjectID `json:"userId"`
	Email     string        `json:"email"`
	Language  string        `json:"language"`
	ExpiresAt int64         `json:"exp"`
	IssuedAt  int64         `json:"iat"`
}

type OAuthService interface {
	GetGoogleAuthURL(state string) string
	ExchangeGoogleCode(ctx context.Context, code string) (*GoogleUserInfo, error)
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	FirstName     string `json:"given_name"`
	LastName      string `json:"family_name"`
	Picture       string `json:"picture"`
	EmailVerified bool   `json:"email_verified"`
}

type AuthService interface {
	HashPassword(password string) (string, error)
	VerifyPassword(hashedPassword, password string) error
	GenerateTokens(userID, email, language string) (accessToken, refreshToken string, err error)
	ValidateAccessToken(token string) (*TokenClaims, error)
	ValidateRefreshToken(token string) (*TokenClaims, error)
	RefreshTokens(refreshToken string) (accessToken, newRefreshToken string, err error)
}
