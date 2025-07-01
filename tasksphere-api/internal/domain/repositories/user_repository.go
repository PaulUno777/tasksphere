package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UserRepository interface {
	Create(ctx context.Context, user *entities.User) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.User, error)
	GetByEmail(ctx context.Context, email string) (*entities.User, error)
	Update(ctx context.Context, user *entities.User) error
	UpdateRefreshToken(ctx context.Context, userID bson.ObjectID, refreshToken string) error
	Delete(ctx context.Context, id bson.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.User, error)
}
