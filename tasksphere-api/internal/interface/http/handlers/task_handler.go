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

	response, err := h.taskUseCase.CreateTask(c.Context(), boardID, userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(c, response, h.i18n.T(lang, "messages.task_created"))
}
