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
	Create(ctx context.Context, task *entities.Task) (*entities.Task, error)
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Task, error)
	GetByBoardID(ctx context.Context, boardID bson.ObjectID, filter *TaskFilter, page, limit int) ([]*entities.Task, int64, error)
	Update(ctx context.Context, task *entities.Task) error
	Delete(ctx context.Context, id bson.ObjectID) error
	UpdateStatus(ctx context.Context, id bson.ObjectID, status entities.TaskStatus, updatedBy bson.ObjectID) error
	AssignTask(ctx context.Context, id, assigneeID bson.ObjectID, updatedBy bson.ObjectID) error
	GetOverdueTasks(ctx context.Context, boardID bson.ObjectID) ([]*entities.Task, error)
	CountByStatus(ctx context.Context, boardID bson.ObjectID) (map[string]int64, error)
}
