package security

import (
	"errors"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

// Custom JWT claims structure
type jwtClaims struct {
	UserID   string `json:"userId"`
	Email    string `json:"email"`
	Language string `json:"language"`
	jwt.RegisteredClaims
}

type JWTService struct {
	accessSecret  string
	refreshSecret string
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

func NewJWTService(config *config.JWTConfig) services.AuthService {
	return &JWTService{
		accessSecret:  config.Secret,
		refreshSecret: config.RefreshSecret,
		accessTTL:     config.AccessExpiry,
		refreshTTL:    config.RefreshExpiry,
	}
}

func (s *JWTService) HashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed), err
}

func (s *JWTService) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func (s *JWTService) GenerateTokens(userID, email, language string) (string, string, error) {
	// Create access token
	accessToken, err := s.createToken(
		userID,
		email,
		language,
		s.accessSecret,
		s.accessTTL,
	)
	if err != nil {
		return "", "", err
	}

	// Create refresh token
	refreshToken, err := s.createToken(
		userID,
		email,
		language,
		s.refreshSecret,
		s.refreshTTL,
	)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *JWTService) createToken(
	userID, email, language, secret string,
	expiry time.Duration,
) (string, error) {
	claims := jwtClaims{
		UserID:   userID,
		Email:    email,
		Language: language,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (s *JWTService) ValidateAccessToken(token string) (*services.TokenClaims, error) {
	return s.validateToken(token, []byte(s.accessSecret), "access")
}

func (s *JWTService) ValidateRefreshToken(token string) (*services.TokenClaims, error) {
	return s.validateToken(token, []byte(s.refreshSecret), "refresh")
}

func (s *JWTService) RefreshTokens(refreshToken string) (string, string, error) {
	claims, err := s.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", "", err
	}
	return s.GenerateTokens(claims.UserID.Hex(), claims.Email, claims.Language)
}

func (s *JWTService) validateToken(tokenString string, secret []byte, tokenType string) (*services.TokenClaims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&jwtClaims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		},
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*jwtClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Convert userID string to ObjectID
	objID, err := bson.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	return &services.TokenClaims{
		UserID:    objID,
		Email:     claims.Email,
		Language:  claims.Language,
		ExpiresAt: claims.ExpiresAt.Unix(),
		IssuedAt:  claims.IssuedAt.Unix(),
	}, nil
}
