package repositories

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type TaskFilter struct {
	Status     entities.TaskStatus
	Priority   entities.Priority
	AssignedTo *bson.ObjectID
	CategoryID *bson.ObjectID
	Search     string
	IsOverdue  *bool
	DueBefore  *time.Time
	DueAfter   *time.Time
	Page       int
	Limit      int
	SortBy     string // title, priority, dueDate, createdAt, updatedAt
	SortOrder  string // asc, desc
}

type TaskWithDetails struct {
	Task         *entities.Task     `json:"task"`
	Board        *entities.Board    `json:"board"`
	Category     *entities.Category `json:"category,omitempty"`
	AssignedUser *entities.User     `json:"assignedUser,omitempty"`
	Creator      *entities.User     `json:"creator"`
	LastEditor   *entities.User     `json:"lastEditor"`
	CommentCount int64              `json:"commentCount"`
}

type TaskRepository interface {
	Create(ctx context.Context, task *entities.Task) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Task, error)
	GetByBoard(ctx context.Context, boardID bson.ObjectID, filter TaskFilter) ([]*entities.Task, int64, error)
	GetByAssignee(ctx context.Context, userID bson.ObjectID, filter TaskFilter) ([]*entities.Task, int64, error)
	GetByCategory(ctx context.Context, categoryID bson.ObjectID, filter TaskFilter) ([]*entities.Task, int64, error)
	Update(ctx context.Context, task *entities.Task) error
	Delete(ctx context.Context, id bson.ObjectID) error
	UpdateStatus(ctx context.Context, taskID bson.ObjectID, status entities.TaskStatus, userID bson.ObjectID) error
	UpdatePosition(ctx context.Context, taskID bson.ObjectID, position int, status entities.TaskStatus, userID bson.ObjectID) error
	UpdateAssignment(ctx context.Context, taskID bson.ObjectID, assignedTo *bson.ObjectID, userID bson.ObjectID) error
	GetTasksForKanban(ctx context.Context, boardID bson.ObjectID) (map[entities.TaskStatus][]*entities.Task, error)
	GetOverdueTasks(ctx context.Context, boardID bson.ObjectID) ([]*entities.Task, error)
	GetTaskWithDetails(ctx context.Context, taskID bson.ObjectID) (*TaskWithDetails, error)
	GetTasksWithDetails(ctx context.Context, boardID bson.ObjectID, filter TaskFilter) ([]*TaskWithDetails, error)
	CountByBoard(ctx context.Context, boardID bson.ObjectID, status entities.TaskStatus) (int64, error)
	CountByCategory(ctx context.Context, categoryID bson.ObjectID) (int64, error)
	CountByAssignee(ctx context.Context, userID bson.ObjectID, status entities.TaskStatus) (int64, error)
}
