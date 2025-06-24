package auth

import "github.com/PaulUno777/tasksphere-api/internal/domain"

type RegisterInput struct {
	Email     string
	FirstName string
	LastName  string
	Password  string
}

type LoginInput struct {
	Email    string
	Password string
}

type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type AuthResponse struct {
	User         *domain.User `json:"user"`
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
}

type AuthUseCase interface {
	Register(input RegisterInput) (*AuthResponse, error)
	Login(input LoginInput) (*AuthResponse, error)
	RefreshToken(token string) (*TokenPair, error)
}
