package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BoardInvitationRepository interface {
	Create(ctx context.Context, invitation *entities.BoardInvitation) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.BoardInvitation, error)
	GetByToken(ctx context.Context, token string) (*entities.BoardInvitation, error)
	GetByBoard(ctx context.Context, boardID bson.ObjectID, status entities.InvitationStatus) ([]*entities.BoardInvitation, error)
	GetByEmail(ctx context.Context, email string, status entities.InvitationStatus) ([]*entities.BoardInvitation, error)
	Update(ctx context.Context, invitation *entities.BoardInvitation) error
	Delete(ctx context.Context, id bson.ObjectID) error
	ExpireOldInvitations(ctx context.Context) error
	CountByBoard(ctx context.Context, boardID bson.ObjectID, status entities.InvitationStatus) (int64, error)
}
