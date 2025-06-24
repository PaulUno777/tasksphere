package http

import (
	"github.com/PaulUno777/tasksphere-api/internal/usecase/auth"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	useCase auth.AuthUseCase
}

func NewAuthHandler(useCase auth.AuthUseCase) *AuthHandler {
	return &AuthHandler{useCase: useCase}
}

func (handler *AuthHandler) Register(ctx *fiber.Ctx) error {
	var input auth.RegisterInput

	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	if input.Email == "" || input.FirstName == "" || input.LastName == "" || input.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "All fields are required")
	}

	response, err := handler.useCase.Register(input)
	if err != nil {
		return fiber.NewError(fiber.StatusConflict, err.Error())
	}

	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (handler *AuthHandler) Login(ctx *fiber.Ctx) error {
	var input auth.LoginInput
	if err := ctx.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}
	if input.Email == "" || input.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Email and password are required")
	}

	response, err := handler.useCase.Login(input)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}

	return ctx.JSON(response)
}

func (handler *AuthHandler) RefreshToken(ctx *fiber.Ctx) error {
	authHeader := ctx.Get("Authorization")
	if len(authHeader) < 8 {
		return fiber.NewError(fiber.StatusUnauthorized, "Refresh token required")
	}
	token := authHeader[7:]

	tokens, err := handler.useCase.RefreshToken(token)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, err.Error())
	}

	return ctx.JSON(tokens)
}
