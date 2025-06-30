package services

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UpdateUserRequest struct {
	FirstName string `json:"first_name" validate:"required,min=1,max=100"`
	LastName  string `json:"last_name" validate:"required,min=1,max=100"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type UserProfile struct {
	User        *entities.User `json:"user"`
	BoardsCount int64          `json:"boards_count"`
	TasksCount  int64          `json:"tasks_count"`
	UnreadCount int64          `json:"unread_notifications_count"`
}

type UserService interface {
	GetProfile(ctx context.Context, userID bson.ObjectID) (*entities.User, error)
	UpdateProfile(ctx context.Context, userID bson.ObjectID, input UpdateUserRequest) error
	GetByID(ctx context.Context, userID bson.ObjectID) (*entities.User, error)
	DeleteAccount(ctx context.Context, userID bson.ObjectID) error
	ListUsers(ctx context.Context, limit, offset int) ([]*entities.User, error)
}
