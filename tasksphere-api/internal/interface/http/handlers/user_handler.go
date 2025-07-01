package handlers

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/user"
	"github.com/gofiber/fiber/v2"
)

// UserHandler handles user endpoints
type UserHandler struct {
	userUseCase *user.UseCase
	i18n        services.I18nService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userUseCase *user.UseCase, i18n services.I18nService) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
		i18n:        i18n,
	}
}

// GetProfile gets user profile
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	response, err := h.userUseCase.GetProfile(c.Context(), userID, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, "")
}

// UpdateProfile updates user profile
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")
	userID := middleware.GetUserIDFromContext(c)

	var req dto.UpdateProfileRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.userUseCase.UpdateProfile(c.Context(), userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.profile_updated"))
}

// UpdatePassword updates user password
func (h *UserHandler) UpdatePassword(c *fiber.Ctx) error {
	lang := middleware.GetLangFromContext(c)
	userID := middleware.GetUserIDFromContext(c)

	var req dto.UpdatePasswordRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	err := h.userUseCase.UpdatePassword(c.Context(), userID, &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, nil, h.i18n.T(lang, "messages.password_updated"))
}
