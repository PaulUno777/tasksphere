package handlers

import (
	"strconv"

	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/category"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CategoryHandler struct {
	categoryUseCase *category.UseCase
	i18n            services.I18nService
}

func NewCategoryHandler(categoryUseCase *category.UseCase, i18n services.I18nService) *CategoryHandler {
	return &CategoryHandler{
		categoryUseCase: categoryUseCase,
		i18n:            i18n,
	}
}

func (h *CategoryHandler) CreateCategory(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("boardId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_board_id"))
	}

	var req dto.CreateCategoryRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.categoryUseCase.CreateCategory(c.Context(), userID, boardID, &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(c, response, h.i18n.T(lang, "messages.category_created"))
}

func (h *CategoryHandler) GetBoardCategories(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	boardID, err := bson.ObjectIDFromHex(c.Params("boardId"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_board_id"))
	}

	// Parse includeInactive parameter
	includeInactive, _ := strconv.ParseBool(c.Query("inactive", "false"))

	response, err := h.categoryUseCase.GetBoardCategories(c.Context(), userID, boardID, includeInactive, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *CategoryHandler) GetCategory(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	categoryID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_category_id"))
	}

	response, err := h.categoryUseCase.GetCategory(c.Context(), userID, categoryID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

func (h *CategoryHandler) UpdateCategory(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	categoryID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_category_id"))
	}

	var req dto.UpdateCategoryRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.categoryUseCase.UpdateCategory(c.Context(), userID, categoryID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.category_updated"))
}

func (h *CategoryHandler) UpdateCategoryPosition(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	categoryID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_category_id"))
	}
	var req dto.UpdateCategoryPositionRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}
	response, err := h.categoryUseCase.UpdateCategoryPosition(c.Context(), userID, categoryID, &req, lang)
	if err != nil {
		return err
	}
	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.category_position_updated"))
}

func (h *CategoryHandler) DeleteCategory(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	categoryID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_category_id"))
	}

	err = h.categoryUseCase.DeleteCategory(c.Context(), userID, categoryID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.category_deleted"))
}

func (h *CategoryHandler) ToggleActiveStatus(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	categoryID, err := bson.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return errors.NewBadRequestError(h.i18n.T(lang, "errors.invalid_category_id"))
	}

	BeforeActiveStatus, err := h.categoryUseCase.ToggleActiveStatus(c.Context(), userID, categoryID, lang)
	if err != nil {
		return err
	}

	if *BeforeActiveStatus {
		return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.category_deactivated"))
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.category_activated"))
}
