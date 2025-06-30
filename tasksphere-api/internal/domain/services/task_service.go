package services

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CreateTaskRequest struct {
	Title        string            `json:"title" validate:"required,min=1,max=255"`
	Description  string            `json:"description" validate:"required,min=1,max=5000"`
	Priority     entities.Priority `json:"priority" validate:"required"`
	DueDate      *time.Time        `json:"due_date,omitempty"`
	AssignedToID *bson.ObjectID    `json:"assigned_to_id,omitempty"`
	CategoryID   *bson.ObjectID    `json:"category_id,omitempty"`
}

type UpdateTaskRequest struct {
	Title       string            `json:"title" validate:"required,min=1,max=255"`
	Description string            `json:"description" validate:"required,min=1,max=5000"`
	Priority    entities.Priority `json:"priority" validate:"required"`
	DueDate     *time.Time        `json:"due_date,omitempty"`
	CategoryID  *bson.ObjectID    `json:"category_id,omitempty"`
}

type UpdateTaskStatusRequest struct {
	Status entities.TaskStatus `json:"status" validate:"required"`
}

type AssignTaskRequest struct {
	AssignedTo *bson.ObjectID `json:"assigned_to_id,omitempty"`
}

type TaskWithDetails struct {
	Task     *entities.Task      `json:"task"`
	Assignee *entities.User      `json:"assignee,omitempty"`
	Category *entities.Category  `json:"category,omitempty"`
	Comments []*entities.Comment `json:"comments"`
}

type TaskFilter struct {
	BoardID      *bson.ObjectID       `json:"board_id,omitempty"`
	AssignedToID *bson.ObjectID       `json:"assigned_to_id,omitempty"`
	Status       *entities.TaskStatus `json:"status,omitempty"`
	Priority     *entities.Priority   `json:"priority,omitempty"`
	CategoryID   *bson.ObjectID       `json:"category_id,omitempty"`
	DueBefore    *time.Time           `json:"due_before,omitempty"`
	DueAfter     *time.Time           `json:"due_after,omitempty"`
	Search       string               `json:"search,omitempty"`
	IsArchived   *bool                `json:"is_archived,omitempty"`
}

type TaskService interface {
	CreateTask(ctx context.Context, boardID bson.ObjectID, req *CreateTaskRequest, creatorID bson.ObjectID) (*entities.Task, error)
	GetTask(ctx context.Context, taskID, userID bson.ObjectID) (*TaskWithDetails, error)
	UpdateTask(ctx context.Context, taskID bson.ObjectID, req *UpdateTaskRequest, userID bson.ObjectID) error
	DeleteTask(ctx context.Context, taskID, userID bson.ObjectID) error
	UpdateTaskStatus(ctx context.Context, taskID bson.ObjectID, req *UpdateTaskStatusRequest, userID bson.ObjectID) error
	AssignTask(ctx context.Context, taskID bson.ObjectID, req *AssignTaskRequest, userID bson.ObjectID) error
	UnassignTask(ctx context.Context, taskID, userID bson.ObjectID) error
	GetBoardTasks(ctx context.Context, boardID, userID bson.ObjectID, limit, offset int) ([]*entities.Task, error)
	GetTasksByFilter(ctx context.Context, filter *TaskFilter, userID bson.ObjectID, limit, offset int) ([]*entities.Task, error)
	ArchiveTask(ctx context.Context, taskID, userID bson.ObjectID) error
	GetOverdueTasks(ctx context.Context) ([]*entities.Task, error)
}

// Comment service
type CreateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1,max=2000"`
}

type CommentWithAuthor struct {
	Comment *entities.Comment `json:"comment"`
	Author  *entities.User    `json:"author"`
}

type CommentService interface {
	CreateComment(ctx context.Context, taskID bson.ObjectID, req *CreateCommentRequest, authorID bson.ObjectID) (*entities.Comment, error)
	GetComment(ctx context.Context, commentID, userID bson.ObjectID) (*CommentWithAuthor, error)
	UpdateComment(ctx context.Context, commentID bson.ObjectID, req *UpdateCommentRequest, userID bson.ObjectID) error
	DeleteComment(ctx context.Context, commentID, userID bson.ObjectID) error
	GetTaskComments(ctx context.Context, taskID, userID bson.ObjectID, limit, offset int) ([]*CommentWithAuthor, error)
}
