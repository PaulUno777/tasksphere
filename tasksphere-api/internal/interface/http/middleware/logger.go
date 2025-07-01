package middleware

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/gofiber/fiber/v2"
)

// Logger returns logging middleware
func Logger(logger *logger.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Log request
		duration := time.Since(start)

		logData := map[string]interface{}{
			"method":     c.Method(),
			"path":       c.Path(),
			"status":     c.Response().StatusCode(),
			"duration":   duration.Milliseconds(),
			"ip":         c.IP(),
			"user_agent": c.Get("User-Agent"),
		}

		if err != nil {
			logData["error"] = err.Error()
			logger.WithFields(logData).Error("Request failed")
		} else {
			logger.WithFields(logData).Info("Request completed")
		}

		return err
	}
}
