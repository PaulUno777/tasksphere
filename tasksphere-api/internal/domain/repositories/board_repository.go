package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// BoardFilter represents board filtering options
type BoardFilter struct {
	Status entities.BoardStatus
	Search string
	Page   int
	Limit  int
}

type BoardRepository interface {
	Create(ctx context.Context, board *entities.Board) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Board, error)
	GetByOwner(ctx context.Context, ownerID bson.ObjectID, status entities.BoardStatus) ([]*entities.Board, error)
	GetByMember(ctx context.Context, userID bson.ObjectID, status entities.BoardStatus) ([]*entities.Board, error)
	Update(ctx context.Context, board *entities.Board) error
	UpdateSettings(ctx context.Context, boardID bson.ObjectID, settings entities.BoardSettings) error
	Delete(ctx context.Context, id bson.ObjectID) error
	GetStats(ctx context.Context, boardID bson.ObjectID) (*entities.BoardStats, error)
	List(ctx context.Context, userID bson.ObjectID, filter BoardFilter) ([]*entities.Board, int64, error)
}
