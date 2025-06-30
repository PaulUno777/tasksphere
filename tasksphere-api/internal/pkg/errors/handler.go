package errors

import (
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/gofiber/fiber/v2"
)

// ErrorHandler handles application errors and returns appropriate HTTP responses
func ErrorHandler(logger *logger.Logger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		// Check if it's an AppError
		if appErr, ok := err.(*AppError); ok {
			logger.Error("Application error",
				"code", appErr.Code,
				"message", appErr.Message,
				"status", appErr.Status,
				"path", c.Path(),
				"method", c.Method(),
			)

			return c.Status(appErr.Status).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    appErr.Code,
					"message": appErr.Message,
				},
			})
		}

		// Handle Fiber errors
		if fiberErr, ok := err.(*fiber.Error); ok {
			logger.Error("Fiber error",
				"code", fiberErr.Code,
				"message", fiberErr.Message,
				"path", c.Path(),
				"method", c.Method(),
			)

			return c.Status(fiberErr.Code).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "FIBER_ERROR",
					"message": fiberErr.Message,
				},
			})
		}

		// Handle unexpected errors
		logger.Error("Unexpected error",
			"error", err.Error(),
			"path", c.Path(),
			"method", c.Method(),
		)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "An unexpected error occurred",
			},
		})
	}
}
