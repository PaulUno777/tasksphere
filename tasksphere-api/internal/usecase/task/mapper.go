package task

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// TaskQueryFilter represents query parameters for task filtering
type TaskQueryFilter struct {
	Status     string // TODO, IN_PROGRESS, REVIEW, COMPLETED, ARCHIVED
	Priority   string // LOW, MEDIUM, HIGH, CRITICAL
	AssignedTo string // User ID
	CategoryID string // Category ID
	Search     string // Text search in title/description
	IsOverdue  *bool  // Filter overdue tasks
	DueBefore  string // Tasks due before this date (ISO format)
	DueAfter   string // Tasks due after this date (ISO format)
	Page       int    // Page number for pagination (default: 1)
	Limit      int    // Items per page (default: 20, max: 100)
	SortBy     string // Field to sort by (position, title, priority, dueDate, createdAt, updatedAt)
	SortOrder  string // Sort order (asc, desc)
}

func (uc *UseCase) convertQueryFilter(filter TaskQueryFilter, boardID bson.ObjectID) (repositories.TaskFilter, error) {
	repoFilter := repositories.TaskFilter{
		Page:      filter.Page,
		Limit:     filter.Limit,
		SortBy:    filter.SortBy,
		SortOrder: filter.SortOrder,
		Search:    filter.Search,
		IsOverdue: filter.IsOverdue,
	}

	// Set defaults
	if repoFilter.Page < 1 {
		repoFilter.Page = 1
	}
	if repoFilter.Limit < 1 || repoFilter.Limit > 100 {
		repoFilter.Limit = 20
	}
	if repoFilter.SortBy == "" {
		repoFilter.SortBy = "position"
	}
	if repoFilter.SortOrder == "" {
		repoFilter.SortOrder = "asc"
	}

	// Parse status
	if filter.Status != "" {
		repoFilter.Status = entities.TaskStatus(filter.Status)
	}

	// Parse priority
	if filter.Priority != "" {
		repoFilter.Priority = entities.Priority(filter.Priority)
	}

	// Parse assignee
	if filter.AssignedTo != "" {
		assigneeID, err := bson.ObjectIDFromHex(filter.AssignedTo)
		if err != nil {
			return repoFilter, err
		}
		repoFilter.AssignedTo = &assigneeID
	}

	// Parse category
	if filter.CategoryID != "" {
		categoryID, err := bson.ObjectIDFromHex(filter.CategoryID)
		if err != nil {
			return repoFilter, err
		}
		repoFilter.CategoryID = &categoryID
	}

	// Parse dates
	if filter.DueBefore != "" {
		date, err := time.Parse(time.RFC3339, filter.DueBefore)
		if err != nil {
			return repoFilter, err
		}
		repoFilter.DueBefore = &date
	}

	if filter.DueAfter != "" {
		date, err := time.Parse(time.RFC3339, filter.DueAfter)
		if err != nil {
			return repoFilter, err
		}
		repoFilter.DueAfter = &date
	}

	return repoFilter, nil
}

func (uc *UseCase) mapTaskToResponse(taskDetail *repositories.TaskWithDetails, userID bson.ObjectID) *dto.TaskResponse {
	task := taskDetail.Task
	response := &dto.TaskResponse{
		ID:           task.GetID(),
		Title:        task.Title,
		Description:  task.Description,
		Status:       string(task.Status),
		Priority:     string(task.Priority),
		Position:     task.Position,
		IsOverdue:    task.IsOverdue(),
		CanEdit:      task.CanBeEdited(),
		CommentCount: int(taskDetail.CommentCount),
		CreatedAt:    task.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    task.UpdatedAt.Format(time.RFC3339),
	}

	// Add dates
	if task.DueDate != nil {
		dueDate := task.DueDate.Format(time.RFC3339)
		response.DueDate = &dueDate
	}
	if task.StartDate != nil {
		startDate := task.StartDate.Format(time.RFC3339)
		response.StartDate = &startDate
	}
	if task.CompletedAt != nil {
		completedAt := task.CompletedAt.Format(time.RFC3339)
		response.CompletedAt = &completedAt
	}
	if task.ArchivedAt != nil {
		archivedAt := task.ArchivedAt.Format(time.RFC3339)
		response.ArchivedAt = &archivedAt
	}

	// Add board info
	if taskDetail.Board != nil {
		response.Board = &dto.BoardSummaryResponse{
			ID:    taskDetail.Board.GetID(),
			Title: taskDetail.Board.Title,
			Color: taskDetail.Board.Color,
		}
	}

	// Add category info
	if taskDetail.Category != nil {
		response.Category = &dto.CategoryResponse{
			ID:       taskDetail.Category.GetID(),
			Name:     taskDetail.Category.Name,
			Color:    taskDetail.Category.Color,
			Position: taskDetail.Category.Position,
			IsActive: taskDetail.Category.IsActive,
		}
	}

	// Add user info
	if taskDetail.AssignedUser != nil {
		response.AssignedTo = dto.UserToResponse(taskDetail.AssignedUser)
	}

	if taskDetail.Creator != nil {
		response.CreatedBy = dto.UserToResponse(taskDetail.Creator)
	}

	if taskDetail.LastEditor != nil {
		response.LastEditedBy = dto.UserToResponse(taskDetail.LastEditor)
	}

	return response
}
