package repositories

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type TaskFilter struct {
	BoardID    *bson.ObjectID `json:"boardId,omitempty"`
	AssignedTo *bson.ObjectID `json:"assignedTo,omitempty"`
	Status     *string        `json:"status,omitempty"`
	Priority   *string        `json:"priority,omitempty"`
	CategoryID *bson.ObjectID `json:"categoryId,omitempty"`
	DueBefore  *time.Time     `json:"dueBefore,omitempty"`
	DueAfter   *time.Time     `json:"dueAfter,omitempty"`
	Search     string         `json:"search,omitempty"`
	IsArchived *bool          `json:"isArchived,omitempty"`
}

type TaskRepository interface {
	Create(ctx context.Context, task *entities.Task) error
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Task, error)
	Update(ctx context.Context, task *entities.Task) error
	Delete(ctx context.Context, id bson.ObjectID) error
	GetByBoard(ctx context.Context, boardID bson.ObjectID, limit, offset int) ([]*entities.Task, error)
	GetByFilter(ctx context.Context, filter *TaskFilter, limit, offset int) ([]*entities.Task, error)
	GetOverdueTasks(ctx context.Context) ([]*entities.Task, error)
	CountByBoard(ctx context.Context, boardID bson.ObjectID) (int64, error)
	CountByStatus(ctx context.Context, boardID bson.ObjectID, status entities.TaskStatus) (int64, error)
	GetTaskStats(ctx context.Context, boardID bson.ObjectID) (map[entities.TaskStatus]int64, error)
	UpdateAssignee(ctx context.Context, taskID bson.ObjectID, assigneeID *bson.ObjectID, updatedBy bson.ObjectID) error
	UpdateStatus(ctx context.Context, taskID bson.ObjectID, status entities.TaskStatus, updatedBy bson.ObjectID) error
}
