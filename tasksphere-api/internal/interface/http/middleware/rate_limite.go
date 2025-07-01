package middleware

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/gofiber/fiber/v2"
)

// RateLimit creates a rate limiting middleware
func RateLimit(cfg config.RateLimitConfig, cacheProvider *cache.Connection, logger *logger.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ip := c.IP()
		route := c.Path()

		// Select limit based on path prefix
		var limit int
		switch {
		case strings.HasPrefix(route, "/auth/"):
			limit = cfg.Auth
		case strings.HasPrefix(route, "/comments/"):
			limit = cfg.Comment
		default:
			limit = cfg.General
		}

		key := fmt.Sprintf("rate_limit:%s:%s", ip, route)
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		countStr, err := cacheProvider.Get(ctx, key)
		count := 0
		if err == nil {
			count, _ = strconv.Atoi(countStr)
		}

		if count >= limit {
			ttl, err := cacheProvider.GetTTL(ctx, key)
			if err == nil && ttl > 0 {
				c.Set("X-RateLimit-Reset", strconv.Itoa(int(ttl.Seconds())))
			}
			c.Set("X-RateLimit-Limit", strconv.Itoa(limit))
			c.Set("X-RateLimit-Remaining", "0")
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Rate limit exceeded",
			})
		}

		count++
		if err := cacheProvider.SetWithTTL(ctx, key, count, cfg.Window); err != nil {
			logger.WithError(err).Warn("Rate limiter: failed to increment counter")
		}

		// Set rate limit headers
		c.Set("X-RateLimit-Limit", strconv.Itoa(limit))
		c.Set("X-RateLimit-Remaining", strconv.Itoa(limit-count))

		return c.Next()
	}
}

