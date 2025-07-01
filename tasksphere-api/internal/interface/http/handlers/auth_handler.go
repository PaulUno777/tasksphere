package handlers

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/dto"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/utils"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/auth"
	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authUseCase *auth.UseCase
	i18n        services.I18nService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authUseCase *auth.UseCase, i18n services.I18nService) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
		i18n:        i18n,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(ctx *fiber.Ctx) error {
	lang := ctx.Get("Accept-Language", "en")

	var req dto.RegisterRequest
	if err := utils.ParseAndValidate(ctx, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.authUseCase.Register(ctx.Context(), &req, lang)
	if err != nil {
		return err
	}

	return utils.CreatedResponse(ctx, response, h.i18n.T(lang, "messages.user_registered"))
}

// Login handles user login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	// Set language context
	lang := c.Get("Accept-Language", "en")

	var req dto.LoginRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.authUseCase.Login(c.Context(), &req, lang)
	if err != nil {
		return errors.NewValidationError(err.Error())
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.user_logged_in"))
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")

	var req dto.RefreshTokenRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.authUseCase.RefreshToken(c.Context(), &req, lang)
	if err != nil {
		return errors.NewValidationError(err.Error())
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.tokens_refreshed"))
}

// GetGoogleAuthURL returns Google OAuth URL
func (h *AuthHandler) GetGoogleAuthURL(c *fiber.Ctx) error {
	// Set language context
	lang := c.Get("Accept-Language", "en")

	response, err := h.authUseCase.GetGoogleAuthURL(c.Context(), lang)
	if err != nil {
		return errors.NewValidationError(err.Error())
	}

	return utils.SuccessResponse(c, response, "")
}

// GoogleAuth handles Google OAuth callback
func (h *AuthHandler) GoogleAuth(c *fiber.Ctx) error {
	lang := c.Get("Accept-Language", "en")

	var req dto.GoogleAuthRequest
	if err := utils.ParseAndValidate(c, &req, lang); err != nil {
		return errors.NewValidationError(err.Error())
	}

	response, err := h.authUseCase.GoogleAuth(c.Context(), &req, lang)
	if err != nil {
		return err
	}

	return utils.SuccessResponse(c, response, h.i18n.T(lang, "messages.google_auth_success"))
}
