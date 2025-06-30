package services

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"first_name" validate:"required,min=1,max=100"`
	LastName  string `json:"last_name" validate:"required,min=1,max=100"`
	Password  string `json:"password" validate:"required,min=8"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type AuthService interface {
	Register(ctx context.Context, req *RegisterRequest) (*entities.User, *AuthTokens, error)
	Login(ctx context.Context, req *LoginRequest) (*entities.User, *AuthTokens, error)
	RefreshTokens(ctx context.Context, req *RefreshTokenRequest) (*AuthTokens, error)
	Logout(ctx context.Context, userID bson.ObjectID) error
}
