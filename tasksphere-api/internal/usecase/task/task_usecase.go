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
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type UseCase struct {
	boardMemberRepo repositories.BoardMemberRepository
	categoryRepo    repositories.CategoryRepository
	commentRepo     repositories.CommentRepository
	boardRepo       repositories.BoardRepository
	userRepo        repositories.UserRepository
	taskRepo        repositories.TaskRepository
	i18n            services.I18nService
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
		i18n:            i18n.Get(),
	}
}

func (uc *UseCase) CreateTask(ctx context.Context, userID, boardID bson.ObjectID, req *dto.CreateTaskRequest, lang string) (*dto.TaskResponse, error) {
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.board_not_found"))
	}

	// Check if user can create tasks (non-guest members)
	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}
	// Get board to check if it can be modified
	board, err := uc.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.board_not_found"))
	}

	if !board.CanBeModified() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.board_cannot_be_modified"))
	}

	// Validate and parse optional fields
	var categoryID *bson.ObjectID
	if req.CategoryID != nil {
		catID, err := bson.ObjectIDFromHex(*req.CategoryID)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_category_id"))
		}

		// Verify category belongs to the board
		category, err := uc.categoryRepo.GetByID(ctx, catID)
		if err != nil || category.BoardID != boardID || !category.IsUsable() {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_category"))
		}
		categoryID = &catID
	}

	var assignedTo *bson.ObjectID
	if req.AssignedTo != nil && *req.AssignedTo != "" {
		assigneeID, err := bson.ObjectIDFromHex(*req.AssignedTo)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_assignee_id"))
		}

		// Verify assignee is a board member
		assigneeMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, assigneeID)
		if err != nil || !assigneeMember.IsActive() {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.assignee_not_board_member"))
		}
		assignedTo = &assigneeID
	}

	// Parse dates
	var dueDate, startDate *time.Time
	if req.DueDate != nil {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_due_date"))
		}
		dueDate = &parsed
	}

	if req.StartDate != nil {
		parsed, err := time.Parse(time.RFC3339, *req.StartDate)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_start_date"))
		}
		startDate = &parsed
	}

	// Validate date logic
	if dueDate != nil && startDate != nil && dueDate.Before(*startDate) {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.due_date_before_start_date"))
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
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
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
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get task with details for response
	taskDetails, err := uc.getTaskWithDetails(ctx, task.ID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

func (uc *UseCase) GetBoardTasks(ctx context.Context, userID, boardID bson.ObjectID, filter *TaskQueryFilter, lang string) (*utils.Page[*dto.TaskResponse], error) {
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.board_not_found"))
	}

	// Convert query filter to repository filter
	repoFilter, err := uc.convertQueryFilter(filter, boardID)
	if err != nil {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_filter"))
	}

	// Get tasks with details
	tasksWithDetails, err := uc.taskRepo.GetTasksWithDetails(ctx, boardID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get total count
	_, total, err := uc.taskRepo.GetByBoard(ctx, boardID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Convert to response DTOs
	taskResponses := make([]*dto.TaskResponse, len(tasksWithDetails))
	for i, taskDetail := range tasksWithDetails {
		taskResponses[i] = uc.mapTaskToResponse(taskDetail, userID)
	}

	// Update member's last activity
	member.UpdateLastActivity()
	uc.boardMemberRepo.Update(ctx, member)

	return utils.NewPage(taskResponses, &filter.BaseFilter, total), nil
}

func (uc *UseCase) GetBoardTasksKanban(ctx context.Context, userID, boardID bson.ObjectID, lang string) (*dto.TaskKanbanResponse, error) {
	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, boardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.board_not_found"))
	}

	// Get tasks organized by status
	kanbanTasks, err := uc.taskRepo.GetTasksForKanban(ctx, boardID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Convert to response DTOs with details
	response := &dto.TaskKanbanResponse{
		Todo:       make([]*dto.TaskResponse, 0),
		InProgress: make([]*dto.TaskResponse, 0),
		Review:     make([]*dto.TaskResponse, 0),
		Completed:  make([]*dto.TaskResponse, 0),
	}

	// Process each status
	for status, tasks := range kanbanTasks {
		taskResponses := make([]*dto.TaskResponse, len(tasks))
		for i, task := range tasks {
			// Create minimal task details for kanban view
			taskDetail := &repositories.TaskWithDetails{
				Task:         task,
				CommentCount: 0, // Will be populated if needed
			}

			// Get essential related data
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

			if task.CategoryID != nil {
				if category, err := uc.categoryRepo.GetByID(ctx, *task.CategoryID); err == nil {
					taskDetail.Category = category
				}
			}

			taskResponses[i] = uc.mapTaskToResponse(taskDetail, userID)
		}

		switch status {
		case entities.TaskStatusToDo:
			response.Todo = taskResponses
		case entities.TaskStatusInProgress:
			response.InProgress = taskResponses
		case entities.TaskStatusReview:
			response.Review = taskResponses
		case entities.TaskStatusCompleted:
			response.Completed = taskResponses
		}
	}

	// Update member's last activity
	member.UpdateLastActivity()
	uc.boardMemberRepo.Update(ctx, member)

	return response, nil
}

func (uc *UseCase) GetTask(ctx context.Context, userID, taskID bson.ObjectID, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access to the board
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Get task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	member.UpdateLastActivity()
	uc.boardMemberRepo.Update(ctx, member)

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

func (uc *UseCase) UpdateTask(ctx context.Context, userID, taskID bson.ObjectID, req *dto.UpdateTaskRequest, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check if user can edit tasks (non-guest members)
	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	// Check if task can be edited
	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_cannot_be_edited"))
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
				return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_category_id"))
			}

			// Verify category belongs to the board
			category, err := uc.categoryRepo.GetByID(ctx, catID)
			if err != nil || category.BoardID != task.BoardID || !category.IsUsable() {
				return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_category"))
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
				return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_due_date"))
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
				return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_start_date"))
			}
			task.StartDate = &parsed
		}
	}

	// Validate date logic
	if task.DueDate != nil && task.StartDate != nil && task.DueDate.Before(*task.StartDate) {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.due_date_before_start_date"))
	}

	// Update metadata
	task.LastEditedBy = &userID
	task.UpdateTimestamp()

	// Save task
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

func (uc *UseCase) UpdateTaskStatus(ctx context.Context, userID, taskID bson.ObjectID, req *dto.UpdateTaskStatusRequest, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_cannot_be_edited"))
	}

	// Update status using business logic
	newStatus := entities.TaskStatus(req.Status)
	task.UpdateStatus(newStatus, userID)

	// Save task
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

func (uc *UseCase) UpdateTaskPosition(ctx context.Context, userID, taskID bson.ObjectID, req *dto.UpdateTaskPositionRequest, lang string) (*dto.TaskResponse, error) {
	// Get task
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_cannot_be_edited"))
	}

	// Update position and status
	newStatus := entities.TaskStatus(req.Status)
	if err := uc.taskRepo.UpdatePosition(ctx, taskID, req.Position, newStatus, userID); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

func (uc *UseCase) AssignTask(ctx context.Context, userID, taskID bson.ObjectID, req *dto.AssignTaskRequest, lang string) (*dto.TaskResponse, error) {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return nil, errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return nil, errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_cannot_be_edited"))
	}

	// Handle assignment
	var assignedTo *bson.ObjectID
	if req.AssignedTo != "" {
		assigneeID, err := bson.ObjectIDFromHex(req.AssignedTo)
		if err != nil {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_assignee_id"))
		}

		assigneeMember, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, assigneeID)
		if err != nil || !assigneeMember.IsActive() {
			return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.assignee_not_board_member"))
		}
		assignedTo = &assigneeID
	}

	// Update assignment using business logic
	task.AssignTo(assignedTo, userID)

	// Save task
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Get updated task with details
	taskDetails, err := uc.getTaskWithDetails(ctx, taskID)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return uc.mapTaskToResponse(taskDetails, userID), nil
}

func (uc *UseCase) ArchiveTask(ctx context.Context, userID, taskID bson.ObjectID, lang string) error {
	// Get task
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if task.IsArchived() {
		return errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_already_archived"))
	}

	// Archive task
	task.Archive(userID)
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *UseCase) RestoreTask(ctx context.Context, userID, taskID bson.ObjectID, lang string) error {
	// Get task
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if !task.IsArchived() {
		return errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_not_archived"))
	}

	// Restore task
	task.Restore(userID)
	if err := uc.taskRepo.Update(ctx, task); err != nil {
		return errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *UseCase) DeleteTask(ctx context.Context, userID, taskID bson.ObjectID, lang string) error {
	task, err := uc.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	// Check user's access and permissions (admin/owner can delete any task, member can delete own task)
	member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
	if err != nil || !member.IsActive() {
		return errors.NewNotFoundError(uc.i18n.T(lang, "errors.task_not_found"))
	}

	if member.Role == entities.BoardRoleGuest {
		return errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	// Only admin/owner can delete other's tasks
	if !member.IsAdmin() && task.CreatedBy != userID {
		return errors.NewForbiddenError(uc.i18n.T(lang, "errors.insufficient_permissions"))
	}

	if !task.CanBeEdited() {
		return errors.NewBadRequestError(uc.i18n.T(lang, "errors.task_cannot_be_edited"))
	}

	// Delete task
	if err := uc.taskRepo.Delete(ctx, taskID); err != nil {
		return errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	return nil
}

func (uc *UseCase) GetMyTasks(ctx context.Context, userID bson.ObjectID, filter *TaskQueryFilter, lang string) (*utils.Page[*dto.TaskResponse], error) {
	// Convert query filter to repository filter
	repoFilter, err := uc.convertQueryFilter(filter, bson.NilObjectID)
	if err != nil {
		return nil, errors.NewBadRequestError(uc.i18n.T(lang, "errors.invalid_filter"))
	}

	// Get tasks assigned to user
	tasks, _, err := uc.taskRepo.GetByAssignee(ctx, userID, repoFilter)
	if err != nil {
		return nil, errors.NewInternalServerError(uc.i18n.T(lang, "errors.internal_error"), err)
	}

	// Filter tasks by board access and convert to detailed responses
	taskResponses := make([]*dto.TaskResponse, 0, len(tasks))

	// Keep track of processed boards to avoid repeated permission checks
	boardAccessCache := make(map[bson.ObjectID]bool)

	for _, task := range tasks {
		// Check if user still has access to the board (with caching)
		hasAccess, exists := boardAccessCache[task.BoardID]
		if !exists {
			member, err := uc.boardMemberRepo.GetByBoardAndUser(ctx, task.BoardID, userID)
			hasAccess = err == nil && member.IsActive()
			boardAccessCache[task.BoardID] = hasAccess
		}

		if hasAccess {
			// Get task with full details
			taskDetail, err := uc.getTaskWithDetails(ctx, task.ID)
			if err != nil {
				// Log error but continue with other tasks
				continue
			}

			taskResponse := uc.mapTaskToResponse(taskDetail, userID)
			taskResponses = append(taskResponses, taskResponse)
		}
	}

	// Adjust total count based on accessible tasks
	accessibleTotal := int64(len(taskResponses))

	return utils.NewPage(taskResponses, &filter.BaseFilter, accessibleTotal), nil
}

func (uc *UseCase) getTaskWithDetails(ctx context.Context, taskID bson.ObjectID) (*repositories.TaskWithDetails, error) {
	// Get task with basic details
	taskWithDetails, err := uc.taskRepo.GetTaskWithDetails(ctx, taskID)
	if err != nil {
		return nil, err
	}

	return taskWithDetails, nil
}
