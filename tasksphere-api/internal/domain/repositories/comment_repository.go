package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CommentFilter struct {
	Type      entities.CommentType
	AuthorID  *bson.ObjectID
	Page      int
	Limit     int
	SortOrder string
}

type CommentWithDetails struct {
	Comment        *entities.Comment `json:"comment"`
	Author         *entities.User    `json:"author"`
	MentionedUsers []*entities.User  `json:"mentionedUsers"`
	Task           *entities.Task    `json:"task"`
}

type CommentRepository interface {
	Create(ctx context.Context, comment *entities.Comment) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Comment, error)
	GetByTask(ctx context.Context, taskID bson.ObjectID, filter CommentFilter) ([]*entities.Comment, int64, error)
	GetByAuthor(ctx context.Context, authorID bson.ObjectID, filter CommentFilter) ([]*entities.Comment, int64, error)
	Update(ctx context.Context, comment *entities.Comment) error
	Delete(ctx context.Context, id bson.ObjectID) error
	SoftDelete(ctx context.Context, id bson.ObjectID, userID bson.ObjectID) error
	AddReaction(ctx context.Context, commentID bson.ObjectID, reaction entities.CommentReaction) error
	RemoveReaction(ctx context.Context, commentID bson.ObjectID, userID bson.ObjectID, emoji string) error
	GetCommentWithDetails(ctx context.Context, commentID bson.ObjectID) (*CommentWithDetails, error)
	GetCommentsWithDetails(ctx context.Context, taskID bson.ObjectID, filter CommentFilter) ([]*CommentWithDetails, error)
	CountByTask(ctx context.Context, taskID bson.ObjectID) (int64, error)
	GetMentionsForUser(ctx context.Context, userID bson.ObjectID, filter CommentFilter) ([]*entities.Comment, int64, error)
}
