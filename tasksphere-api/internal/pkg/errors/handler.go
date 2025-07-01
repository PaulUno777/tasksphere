package errors

import (
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/gofiber/fiber/v2"
)

// ErrorHandler handles application errors and returns appropriate HTTP responses
func ErrorHandler(log *logger.Logger) fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		path := c.Path()
		method := c.Method()

		// Handle custom AppError
		if appErr, ok := err.(*AppError); ok {
			log.WithFields(map[string]interface{}{
				"error_type": "AppError",
				"code":       appErr.Code,
				"message":    appErr.Message,
				"status":     appErr.Status,
				"path":       path,
				"method":     method,
			}).Errorf("Error: %v", appErr.Err)

			return c.Status(appErr.Status).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    appErr.Code,
					"message": appErr.Message,
				},
			})
		}

		// Handle Fiber built-in errors
		if fiberErr, ok := err.(*fiber.Error); ok {
			log.WithFields(map[string]interface{}{
				"error_type": "FiberError",
				"code":       fiberErr.Code,
				"message":    fiberErr.Message,
				"path":       path,
				"method":     method,
			}).Errorf("Error: %v", fiberErr.Error())

			return c.Status(fiberErr.Code).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "FIBER_ERROR",
					"message": fiberErr.Message,
				},
			})
		}

		// Handle unexpected/unwrapped errors
		log.WithFields(map[string]interface{}{
			"error_type": "Internal",
			"message":    err.Error(),
			"path":       path,
			"method":     method,
		}).Errorf("Error: %v", err)

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "An unexpected error occurred",
			},
		})
	}
}
