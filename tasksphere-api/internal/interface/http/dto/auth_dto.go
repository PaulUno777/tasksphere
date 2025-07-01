package dto

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"firstName" validate:"required,min=2,max=50"`
	LastName  string `json:"lastName" validate:"required,min=2,max=50"`
	Password  string `json:"password" validate:"required,password"`
	Language  string `json:"language,omitempty" validate:"omitempty,oneof=en fr"`
}

// LoginRequest represents user login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RefreshTokenRequest represents refresh token request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

// UpdatePasswordRequest represents password update request
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required,password"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	User         UserProfile `json:"user"`
}

// GoogleAuthRequest represents Google OAuth request
type GoogleAuthRequest struct {
	Code  string `json:"code" validate:"required"`
	State string `json:"state" validate:"required"`
	Language string `json:"language" validate:"omitempty,oneof=en fr"`
}

type GoogleAuthURLResponse struct {
	AuthURL string `json:"authUrl"`
	State   string `json:"state"`
}

func UserToProfile(user *entities.User) *UserProfile {
	return &UserProfile{
		ID:              user.ID.Hex(),
		Email:           user.Email,
		FirstName:       user.FirstName,
		LastName:        user.LastName,
		IsEmailVerified: user.IsEmailVerified,
		Language:        user.Language,
		AvatarURL:       user.AvatarURL,
		CreatedAt:       user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       user.UpdatedAt.Format(time.RFC3339),
	}
}
