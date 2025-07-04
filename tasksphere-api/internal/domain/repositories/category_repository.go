package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *entities.Category) (*entities.Category, error)
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Category, error)
	GetByBoardID(ctx context.Context, boardID bson.ObjectID) ([]*entities.Category, error)
	Update(ctx context.Context, category *entities.Category) error
	Delete(ctx context.Context, id bson.ObjectID) error
	NameExists(ctx context.Context, boardID bson.ObjectID, name string, excludeID *bson.ObjectID) (bool, error)
}
