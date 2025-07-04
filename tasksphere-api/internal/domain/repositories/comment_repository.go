package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CommentRepository interface {
	Create(ctx context.Context, comment *entities.Comment) (*entities.Comment, error)
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Comment, error)
	GetByTaskID(ctx context.Context, taskID bson.ObjectID, page, limit int) ([]*entities.Comment, int64, error)
	Update(ctx context.Context, comment *entities.Comment) error
	Delete(ctx context.Context, id bson.ObjectID) error
}
