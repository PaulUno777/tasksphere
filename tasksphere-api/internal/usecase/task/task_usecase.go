package task

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UseCase struct {
	boardMemberRepo repositories.BoardMemberRepository
	categoryRepo    repositories.CategoryRepository
	commentRepo     repositories.CommentRepository
	boardRepo       repositories.BoardRepository
	userRepo        repositories.UserRepository
	taskRepo        repositories.TaskRepository
	localizer       services.I18nService
}

func NewUseCase(
	boardMemberRepo repositories.BoardMemberRepository,
	categoryRepo repositories.CategoryRepository,
	commentRepo repositories.CommentRepository,
	boardRepo repositories.BoardRepository,
	userRepo repositories.UserRepository,
	taskRepo repositories.TaskRepository,
) *UseCase {
	return &UseCase{
		boardMemberRepo: boardMemberRepo,
		categoryRepo:    categoryRepo,
		commentRepo:     commentRepo,
		boardRepo:       boardRepo,
		userRepo:        userRepo,
		taskRepo:        taskRepo,
		localizer:       i18n.Get(),
	}
}

func (uc *UseCase) CreateTask(ctx context.Context, userID, boardID bson.ObjectID, req *dto.CreateTaskRequest, lang string) (*dto.TaskResponse, error) {
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	// Check if user can create tasks (non-guest members)
	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}
	// Get board to check if it can be modified
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.board_not_found"))
	}

	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.board_cannot_be_modified"))
	}

	// Validate and parse optional fields
	var categoryID *bson.ObjectID
	if req.CategoryID != nil && *req.CategoryID != "" {
		catID, err := bson.ObjectIDFromHex(*req.CategoryID)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_category_id"))
		}

		// Verify category belongs to the board
		category, err := uc.categoryRepo.GetByID(ctx, catID)
		if err != nil || category.BoardID != boardID || !category.IsUsable() {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_category"))
		}
		categoryID = &catID
	}

	var assignedTo *bson.ObjectID
	if req.AssignedTo != nil && *req.AssignedTo != "" {
		assigneeID, err := bson.ObjectIDFromHex(*req.AssignedTo)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_assignee_id"))
		}

		// Verify assignee is a board member
		assigneeMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, assigneeID)
		if err != nil || !assigneeMember.IsActive() {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.assignee_not_board_member"))
		}
		assignedTo = &assigneeID
	}

	// Parse dates
	var dueDate, startDate *time.Time
	if req.DueDate != nil {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_due_date"))
		}
		dueDate = &parsed
	}

	if req.StartDate != nil {
		parsed, err := time.Parse(time.RFC3339, *req.StartDate)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_start_date"))
		}
		startDate = &parsed
	}

	// Validate date logic
	if dueDate != nil && startDate != nil && dueDate.Before(*startDate) {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.due_date_before_start_date"))
	}

	// Set default priority
	priority := entities.PriorityNormal
	if req.Priority != "" {
		priority = entities.Priority(req.Priority)
	}

	// Get next position for new task (TODO status)
	tasks, _, err := uc.taskRepo.GetByBoard(ctx, boardID, repositories.TaskFilter{
		Status:    entities.TaskStatusToDo,
		Limit:     1,
		SortBy:    "position",
		SortOrder: "desc",
	})
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}
	position := 1
	if len(tasks) > 0 {
		position = tasks[0].Position + 1
	}

	// Create task entity
	task := &entities.Task{
		Base:         entities.NewBase(),
		Title:        req.Title,
		Description:  &req.Description,
		Status:       entities.TaskStatusToDo,
		Priority:     priority,
		BoardID:      boardID,
		CategoryID:   categoryID,
		AssignedTo:   assignedTo,
		CreatedBy:    userID,
		DueDate:      dueDate,
		StartDate:    startDate,
		Position:     position,
		LastEditedBy: &userID,
	}

	// Save task

	if err := uc.taskRepo.Create(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get task with details for response
	taskDetails, err := uc.getTaskWithDetails(ctx, task.ID, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

// GetTask gets a task by ID
func (uc *UseCase) GetTask(ctx context.Context, userID, taskID bson.ObjectID, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Get task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	member.UpdateLastActivity()
	uc.boardMemberRepo.Update(ctx, member)

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

// UpdateTask updates a task
func (uc *UseCase) UpdateTask(ctx context.Context, userID, taskID bson.ObjectID, req *dto.UpdateTaskRequest, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Check if user can edit tasks (non-guest members)
	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Check if task can be edited
	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.task_cannot_be_edited"))
	}

	// Update fields
	if req.Title != nil {
		task.Title = *req.Title
	}

	if req.Description != nil {
		task.Description = req.Description
	}

	if req.Priority != nil {
		task.Priority = entities.Priority(*req.Priority)
	}

	if req.CategoryID != nil {
		if *req.CategoryID == "" {
			task.CategoryID = nil
		} else {
			catID, err := bson.ObjectIDFromHex(*req.CategoryID)
			if err != nil {
				return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_category_id"))
			}

			// Verify category belongs to the board
			category, err := uc.categoryRepo.GetByID(ctx, catID)
			if err != nil || category.BoardID != task.BoardID || !category.IsUsable() {
				return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_category"))
			}
			task.CategoryID = &catID
		}
	}

	// Parse and update dates
	if req.DueDate != nil {
		if *req.DueDate == "" {
			task.DueDate = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, *req.DueDate)
			if err != nil {
				return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_due_date"))
			}
			task.DueDate = &parsed
		}
	}

	if req.StartDate != nil {
		if *req.StartDate == "" {
			task.StartDate = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, *req.StartDate)
			if err != nil {
				return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_start_date"))
			}
			task.StartDate = &parsed
		}
	}

	// Validate date logic
	if task.DueDate != nil && task.StartDate != nil && task.DueDate.Before(*task.StartDate) {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.due_date_before_start_date"))
	}

	// Update metadata
	task.LastEditedBy = &userID
	task.UpdateTimestamp()

	// Save task
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

// UpdateTaskStatus updates task status
func (uc *UseCase) UpdateTaskStatus(ctx context.Context, userID, taskID bson.ObjectID, req *dto.UpdateTaskStatusRequest, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.task_cannot_be_edited"))
	}

	// Update status using business logic
	newStatus := entities.TaskStatus(req.Status)
	task.UpdateStatus(newStatus, userID)

	// Save task
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

// AssignTask assigns a task to a user
func (uc *UseCase) AssignTask(ctx context.Context, userID, taskID bson.ObjectID, req *dto.AssignTaskRequest, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.task_cannot_be_edited"))
	}

	// Handle assignment
	var assignedTo *bson.ObjectID
	if req.AssignedTo != "" {
		assigneeID, err := bson.ObjectIDFromHex(req.AssignedTo)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.invalid_assignee_id"))
		}

		assigneeMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, assigneeID)
		if err != nil || !assigneeMember.IsActive() {
			return nil, errors.NewBadRequestError(uc.localizer.T(lang, "errors.assignee_not_board_member"))
		}
		assignedTo = &assigneeID
	}

	// Update assignment using business logic
	task.AssignTo(assignedTo, userID)

	// Save task
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID, userID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

// DeleteTask deletes a task
func (uc *UseCase) DeleteTask(ctx context.Context, userID, taskID bson.ObjectID, lang string) error {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions (admin/owner can delete any task, member can delete own task)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.localizer.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	// Only admin/owner can delete other's tasks
	if !member.IsAdmin() && task.CreatedBy != userID {
		return errors.NewForbiddenError(uc.localizer.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return errors.NewBadRequestError(uc.localizer.T(lang, "errors.task_cannot_be_edited"))
	}

	// Delete task
	if err := uc.taskRepo.Delete(ctx, taskID); err != nil {
		return errors.NewInternalServerError(uc.localizer.T(lang, "errors.internal_error"), err)
	}

	return nil
}

// getTaskWithDetails gets a task with all related details
func (uc *UseCase) getTaskWithDetails(ctx context.Context, taskID bson.ObjectID, userID bson.ObjectID) (*repositories.TaskWithDetails, error) {
	// Get task with basic details
	tasksWithDetails, err := uc.taskRepo.GetTasksWithDetails(ctx, bson.NilObjectID, repositories.TaskFilter{
		Page:  1,
		Limit: 1,
	})
	if err != nil {
		return nil, err
	}

	for _, taskDetail := range tasksWithDetails {
		if taskDetail.Task.ID == taskID {
			return taskDetail, nil
		}
	}

	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	taskDetail := &repositories.TaskWithDetails{
		Task: task,
	}

	if board, err := uc.boardRepo.GetByID(ctx, task.BoardID); err == nil {
		taskDetail.Board = board
	}

	if task.CategoryID != nil {
		if category, err := uc.categoryRepo.GetByID(ctx, *task.CategoryID); err == nil {
			taskDetail.Category = category
		}
	}

	if task.AssignedTo != nil {
		if user, err := uc.userRepo.GetByID(ctx, *task.AssignedTo); err == nil {
			taskDetail.AssignedUser = user
		}
	}

	if user, err := uc.userRepo.GetByID(ctx, task.CreatedBy); err == nil {
		taskDetail.Creator = user
	}

	if user, err := uc.userRepo.GetByID(ctx, *task.LastEditedBy); err == nil {
		taskDetail.LastEditor = user
	}

	if count, err := uc.commentRepo.CountByTask(ctx, taskID); err == nil {
		taskDetail.CommentCount = count
	}

	return taskDetail, nil
}
