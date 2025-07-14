package handlers

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/task"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type TaskHandler struct {
	taskUseCase *task.UseCase
	i18n        services.I18nService
}

// NewUserHandler creates a new user handler
func NewTaskHandler(userUseCase *task.UseCase, i18n services.I18nService) *TaskHandler {
	return &TaskHandler{
		taskUseCase: userUseCase,
		i18n:        i18n,
	}
}

func (h *TaskHandler) CreateTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("boardId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_board_id"))
	}

	var req dto.CreateTaskRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.taskUseCase.CreateTask(c.Context(), userID, boardID, &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(c, response, h.i18n.T(lang, "messages.task_created"))
}

func (h *TaskHandler) GetBoardTasks(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("boardId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_board_id"))
	}

	// Unified parsing
	filter, err := utils.ParseFilterFromFiber[task.TaskQueryFilter](c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid query parameters")
	}

	response, err := h.taskUseCase.GetBoardTasks(c.Context(), userID, boardID, filter, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *TaskHandler) GetTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	response, err := h.taskUseCase.GetTask(c.Context(), userID, taskID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *TaskHandler) GetBoardTasksKanban(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("boardId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_board_id"))
	}

	response, err := h.taskUseCase.GetBoardTasksKanban(c.Context(), userID, boardID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *TaskHandler) GetMyTasks(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	// Unified parsing
	filter, err := utils.ParseFilterFromFiber[task.TaskQueryFilter](c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid query parameters")
	}

	response, err := h.taskUseCase.GetMyTasks(c.Context(), userID, filter, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *TaskHandler) UpdateTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	var req dto.UpdateTaskRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.taskUseCase.UpdateTask(c.Context(), userID, taskID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.task_updated"))
}

func (h *TaskHandler) UpdateTaskStatus(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	var req dto.UpdateTaskStatusRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.taskUseCase.UpdateTaskStatus(c.Context(), userID, taskID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.task_status_updated"))
}

func (h *TaskHandler) UpdateTaskPosition(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	var req dto.UpdateTaskPositionRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.taskUseCase.UpdateTaskPosition(c.Context(), userID, taskID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.task_position_updated"))
}

func (h *TaskHandler) AssignTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	var req dto.AssignTaskRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.taskUseCase.AssignTask(c.Context(), userID, taskID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.task_assigned"))
}

func (h *TaskHandler) ArchiveTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	err = h.taskUseCase.ArchiveTask(c.Context(), userID, taskID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.task_archived"))
}

func (h *TaskHandler) RestoreTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	err = h.taskUseCase.RestoreTask(c.Context(), userID, taskID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.task_restored"))
}

func (h *TaskHandler) DeleteTask(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	taskID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_task_id"))
	}

	err = h.taskUseCase.DeleteTask(c.Context(), taskID, userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.task_deleted"))
}
