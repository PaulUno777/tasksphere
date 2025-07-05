package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryWithTaskCount struct {
	Category  *entities.Category `json:"category"`
	TaskCount int64              `json:"taskCount"`
}

type CategoryRepository interface {
	Create(ctx context.Context, category *entities.Category) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Category, error)
	GetByBoard(ctx context.Context, boardID bson.ObjectID, includeInactive bool) ([]*entities.Category, error)
	GetByName(ctx context.Context, boardID bson.ObjectID, name string) (*entities.Category, error)
	Update(ctx context.Context, category *entities.Category) error
	Delete(ctx context.Context, id bson.ObjectID) error
	UpdatePosition(ctx context.Context, categoryID bson.ObjectID, position int) error
	GetCategoriesWithTaskCount(ctx context.Context, boardID bson.ObjectID) ([]*CategoryWithTaskCount, error)
	GetMaxPosition(ctx context.Context, boardID bson.ObjectID) (int, error)
	IsNameAvailable(ctx context.Context, boardID bson.ObjectID, name string, excludeID *bson.ObjectID) (bool, error)
}
