package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CommentRepository interface {
	Create(ctx context.Context, comment *entities.Comment) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Comment, error)
	Update(ctx context.Context, comment *entities.Comment) error
	Delete(ctx context.Context, id bson.ObjectID) error
	GetByTask(ctx context.Context, taskID bson.ObjectID, limit, offset int) ([]*entities.Comment, error)
	CountByTask(ctx context.Context, taskID bson.ObjectID) (int64, error)
	DeleteByTask(ctx context.Context, taskID bson.ObjectID) error
}
