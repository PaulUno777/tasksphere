package middleware

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/pkg/logger"
	"github.com/gofiber/fiber/v2"
)

func RequestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		status := c.Response().StatusCode()

		logger.InfoLogger.Printf("%s %s [%d] %s", c.Method(), c.Path(), status, duration)

		return err
	}
}
