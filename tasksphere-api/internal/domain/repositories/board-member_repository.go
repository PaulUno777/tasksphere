package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardMemberRepository interface {
	Create(ctx context.Context, member *entities.BoardMember) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.BoardMember, error)
	GetByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) (*entities.BoardMember, error)
	Update(ctx context.Context, member *entities.BoardMember) error
	Delete(ctx context.Context, id bson.ObjectID) error
	DeleteByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) error
	GetByBoard(ctx context.Context, boardID bson.ObjectID) ([]*entities.BoardMember, error)
	GetByUser(ctx context.Context, userID bson.ObjectID) ([]*entities.BoardMember, error)
	ExistsByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) (bool, error)
	CountByBoard(ctx context.Context, boardID bson.ObjectID) (int64, error)
}
