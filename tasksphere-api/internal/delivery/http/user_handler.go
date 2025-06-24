package http

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"github.com/PaulUno777/tasksphere-api/pkg/crypto"
	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userRepo domain.UserRepository
}

func NewUserHandler(userRepo domain.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	user := c.Locals("user").(*domain.User)

	return c.JSON(fiber.Map{
		"id":        user.ID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}

func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	user := c.Locals("user").(*domain.User)
	var body struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Password  string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	if body.FirstName != "" {
		user.FirstName = body.FirstName
	}
	if body.LastName != "" {
		user.LastName = body.LastName
	}
	if body.Password != "" {
		hashed, err := crypto.HashPassword(body.Password)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "Failed to hash password")
		}
		user.PasswordHash = string(hashed)
	}
	user.UpdatedAt = time.Now()

	if err := h.userRepo.Update(user); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Could not update user")
	}

	return c.JSON(fiber.Map{
		"id":        user.ID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
	})
}
