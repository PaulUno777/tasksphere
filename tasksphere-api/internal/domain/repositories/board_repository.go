package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardRepository interface {
	Create(ctx context.Context, board *entities.Board) (*entities.Board, error)
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Board, error)
	GetByOwnerID(ctx context.Context, ownerID bson.ObjectID, limit, skip int) ([]*entities.Board, int64, error)
	Update(ctx context.Context, board *entities.Board) error
	Delete(ctx context.Context, id bson.ObjectID) error

	// Board member operations
	AddMember(ctx context.Context, member *entities.BoardMember) error
	RemoveMember(ctx context.Context, boardID, userID bson.ObjectID) error
	GetMembers(ctx context.Context, boardID bson.ObjectID) ([]*entities.BoardMember, error)
	UpdateMemberRole(ctx context.Context, boardID, userID bson.ObjectID, role entities.BoardRole) error
	GetUserBoards(ctx context.Context, userID bson.ObjectID, limit, skip int) ([]*entities.Board, int64, error)
}
