package middleware

import (
	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"github.com/PaulUno777/tasksphere-api/pkg/jwt"
	"github.com/gofiber/fiber/v2"
)

func JWTAuth(userRepo domain.UserRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if len(authHeader) < 8 || authHeader[:7] != "Bearer " {
			return fiber.NewError(fiber.StatusUnauthorized, "Access token required")
		}

		token := authHeader[7:]
		
		payload, err := jwt.VerifyAccessToken(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid access token")
		}

		user, err := userRepo.FindByID(payload.UserID)
		if err != nil || user == nil {
			return fiber.NewError(fiber.StatusUnauthorized, "User not found")
		}

		c.Locals("user", user)
		return c.Next()
	}
}
