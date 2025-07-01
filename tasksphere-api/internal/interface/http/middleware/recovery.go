package middleware

import (
	"runtime/debug"

	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/gofiber/fiber/v2"
)

// Recovery creates a recovery middleware that handles panics
func Recovery(logger *logger.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				// Log the panic with stack trace
				logger.Error("Panic recovered",
					"panic", r,
					"stack", string(debug.Stack()),
					"path", c.Path(),
					"method", c.Method(),
					"ip", c.IP(),
				)

				// Return internal server error
				c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": fiber.Map{
						"code":    "INTERNAL_SERVER_ERROR",
						"message": "An unexpected error occurred",
					},
				})
			}
		}()

		return c.Next()
	}
}
