package dto

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

type UserCreateRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"firstName" validate:"required,min=2,max=50"`
	LastName  string `json:"lastName" validate:"required,min=2,max=50"`
	Password  string `json:"password" validate:"required,min=8"`
	Language  string `json:"language" validate:"required,oneof=en fr"`
}

type UserUpdateRequest struct {
	FirstName string `json:"firstName" validate:"omitempty,min=2,max=50"`
	LastName  string `json:"lastName" validate:"omitempty,min=2,max=50"`
	Language  string `json:"language" validate:"omitempty,oneof=en fr"`
}

type UserResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Language  string    `json:"language"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type UserMapper struct {
	user entities.User
}

// ToResponse converts User to UserResponse
func (mapper *UserMapper) ToResponse() *UserResponse {
	return &UserResponse{
		ID:        mapper.user.ID.Hex(),
		Email:     mapper.user.Email,
		FirstName: mapper.user.FirstName,
		LastName:  mapper.user.LastName,
		Language:  mapper.user.Language,
		CreatedAt: mapper.user.CreatedAt,
		UpdatedAt: mapper.user.UpdatedAt,
	}
}
