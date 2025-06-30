package services

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CreateBoardRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=255"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=1000"`
}

type UpdateBoardRequest struct {
	Title       string  `json:"title" validate:"required,min=1,max=255"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=1000"`
}

type AddMemberRequest struct {
	Email string             `json:"email" validate:"required,email"`
	Role  entities.BoardRole `json:"role" validate:"required"`
}

type UpdateMemberRoleRequest struct {
	Role entities.BoardRole `json:"role" validate:"required"`
}

type BoardStatistics struct {
	TotalTasks      int64                         `json:"total_tasks"`
	CompletedTasks  int64                         `json:"completed_tasks"`
	InProgressTasks int64                         `json:"in_progress_tasks"`
	OverdueTasks    int64                         `json:"overdue_tasks"`
	TasksByStatus   map[entities.TaskStatus]int64 `json:"tasks_by_status"`
	CompletionRate  float64                       `json:"completion_rate"`
}

type BoardWithRole struct {
	Board *entities.Board    `json:"board"`
	Role  entities.BoardRole `json:"role"`
}

type BoardService interface {
	CreateBoard(ctx context.Context, req *CreateBoardRequest, ownerID bson.ObjectID) (*entities.Board, error)
	GetBoard(ctx context.Context, boardID, userID bson.ObjectID) (*entities.Board, error)
	UpdateBoard(ctx context.Context, boardID bson.ObjectID, req *UpdateBoardRequest, userID bson.ObjectID) error
	DeleteBoard(ctx context.Context, boardID, userID bson.ObjectID) error
	GetUserBoards(ctx context.Context, userID bson.ObjectID, limit, offset int) ([]*BoardWithRole, error)
	GetBoardStats(ctx context.Context, boardID, userID bson.ObjectID) (*BoardStatistics, error)

	// Member management
	AddMember(ctx context.Context, boardID bson.ObjectID, req *AddMemberRequest, inviterID bson.ObjectID) (*entities.BoardMember, error)
	RemoveMember(ctx context.Context, boardID, targetUserID, adminID bson.ObjectID) error
	UpdateMemberRole(ctx context.Context, boardID, targetUserID bson.ObjectID, req *UpdateMemberRoleRequest, adminID bson.ObjectID) error
	GetBoardMembers(ctx context.Context, boardID, userID bson.ObjectID) ([]*entities.BoardMember, error)

	// Permission checks
	HasAccess(ctx context.Context, userID, boardID bson.ObjectID) (bool, error)
	HasRole(ctx context.Context, userID, boardID bson.ObjectID, requiredRole entities.BoardRole) (bool, error)
	GetUserRole(ctx context.Context, userID, boardID bson.ObjectID) (*entities.BoardRole, error)
}

// Category service
type CreateCategoryRequest struct {
	Name  string `json:"name" validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,hexcolor"`
}

type UpdateCategoryRequest struct {
	Name  string `json:"name" validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,hexcolor"`
}

type CategoryService interface {
	CreateCategory(ctx context.Context, boardID bson.ObjectID, req *CreateCategoryRequest, userID bson.ObjectID) (*entities.Category, error)
	GetCategory(ctx context.Context, categoryID, userID bson.ObjectID) (*entities.Category, error)
	UpdateCategory(ctx context.Context, categoryID bson.ObjectID, req *UpdateCategoryRequest, userID bson.ObjectID) error
	DeleteCategory(ctx context.Context, categoryID, userID bson.ObjectID) error
	GetBoardCategories(ctx context.Context, boardID, userID bson.ObjectID) ([]*entities.Category, error)
}
