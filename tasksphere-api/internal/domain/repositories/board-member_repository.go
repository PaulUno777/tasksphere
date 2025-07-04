package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// MemberWithUserInfo represents board member with user information
type MemberWithUserInfo struct {
	Member *entities.BoardMember `json:"member"`
	User   *entities.User        `json:"user"`
}

type BoardMemberRepository interface {
	Create(ctx context.Context, member *entities.BoardMember) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.BoardMember, error)
	GetByBoardAndUser(ctx context.Context, boardID, userID bson.ObjectID) (*entities.BoardMember, error)
	GetByBoard(ctx context.Context, boardID bson.ObjectID, status entities.MemberStatus) ([]*entities.BoardMember, error)
	GetByUser(ctx context.Context, userID bson.ObjectID, status entities.MemberStatus) ([]*entities.BoardMember, error)
	Update(ctx context.Context, member *entities.BoardMember) error
	UpdateRole(ctx context.Context, memberID bson.ObjectID, role entities.BoardRole) error
	UpdateStatus(ctx context.Context, memberID bson.ObjectID, status entities.MemberStatus) error
	UpdateNotificationSettings(ctx context.Context, memberID bson.ObjectID, settings entities.NotificationSettings) error
	Delete(ctx context.Context, id bson.ObjectID) error
	CountByBoard(ctx context.Context, boardID bson.ObjectID, status entities.MemberStatus) (int64, error)
	GetMembersWithUserInfo(ctx context.Context, boardID bson.ObjectID) ([]*MemberWithUserInfo, error)
}
