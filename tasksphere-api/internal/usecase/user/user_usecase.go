package auth

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain"
)

type UpdateProfileInput struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Password  string `json:"Password"`
}

type UserUseCase interface {
	GetProfile(user *domain.User) *domain.User
	UpdateProfile(iid string, input UpdateProfileInput) (*domain.User, error)
}
