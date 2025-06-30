package security

import (
	"errors"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type JWTService struct {
	accessSecret      string
	refreshSecret     string
	accessExpiryMin   int
	refreshExpiryHour int
}

// Claims represents JWT claims
type Claims struct {
	UserID   string `json:"userId"`
	Email    string `json:"email"`
	Language string `json:"language"`
	jwt.RegisteredClaims
}

// TokenPair represents access and refresh tokens
type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expires_in"`
}

func NewJWTService(config *config.Config) *JWTService {
	return &JWTService{
		accessSecret:      config.JWT.Secret,
		refreshSecret:     config.JWT.RefreshSecret,
		accessExpiryMin:   int(config.JWT.AccessExpiry),
		refreshExpiryHour: int(config.JWT.RefreshExpiry),
	}
}

func (j *JWTService) GenerateTokenPair(userID bson.ObjectID, email string) (*TokenPair, error) {
	// Generate access token
	accessToken, err := j.generateAccessToken(userID.Hex(), email)
	if err != nil {
		return nil, err
	}

	// Generate refresh token
	refreshToken, err := j.generateRefreshToken(userID.Hex(), email)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(j.accessExpiryMin * 60), // Convert to seconds
	}, nil
}

// RefreshTokenPair generates new tokens using refresh token
func (j *JWTService) RefreshTokenPair(refreshToken string) (*TokenPair, error) {
	// Validate refresh token
	claims, err := j.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Convert userID back to ObjectID
	userID, err := bson.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return nil, errors.New("invalid user ID in token")
	}

	// Generate new token pair
	return j.GenerateTokenPair(userID, claims.Email)
}

// GetUserIDFromToken extracts user ID from access token without validation
func (j *JWTService) GetUserIDFromToken(tokenString string) (bson.ObjectID, error) {
	claims, err := j.ValidateAccessToken(tokenString)
	if err != nil {
		return bson.NilObjectID, err
	}

	userID, err := bson.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return bson.NilObjectID, errors.New("invalid user ID in token")
	}

	return userID, nil
}

func (j *JWTService) generateAccessToken(userID, email string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(j.accessExpiryMin) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "tasktphere",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.accessSecret))
}

func (j *JWTService) generateRefreshToken(userID, email string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(j.refreshExpiryHour) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "tasktphere",
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.refreshSecret))
}

func (j *JWTService) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.accessSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func (j *JWTService) ValidateRefreshToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.refreshSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid refresh token")
}
