package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardRepository interface {
	Create(ctx context.Context, board *entities.Board) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Board, error)
	Update(ctx context.Context, board *entities.Board) error
	Delete(ctx context.Context, id bson.ObjectID) error
	GetByOwner(ctx context.Context, ownerID bson.ObjectID, limit, offset int) ([]*entities.Board, error)
	GetByMember(ctx context.Context, userID bson.ObjectID, limit, offset int) ([]*entities.Board, error)
	ExistsByID(ctx context.Context, id bson.ObjectID) (bool, error)
}
