package routes

import (
	"strings"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/interface/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func Setup(
	app *fiber.App,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *logger.Logger,
) {
	// Recovery middleware (should be first)
	app.Use(middleware.Recovery(logger))

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.Server.CORSOrigins, ","),
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With",
		AllowCredentials: true,
	}))

	// Request logging middleware
	app.Use(middleware.Logger(logger))

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"service":   "TaskSphere API",
			"timestamp": time.Now().UTC(),
		})
	})

	// API routes
	api := app.Group("/api/v1")

	// Rate limiting middleware
	api.Use(middleware.RateLimit(cfg.RateLimit, redisClient, logger))

	// Setup route groups (to be implemented in future phases)
	setupAuthRoutes(api, cfg, mongoDB, redisClient, logger)
	setupUserRoutes(api, cfg, mongoDB, redisClient, logger)
	setupBoardRoutes(api, cfg, mongoDB, redisClient, logger)
	setupTaskRoutes(api, cfg, mongoDB, redisClient, logger)
	setupNotificationRoutes(api, cfg, mongoDB, redisClient, logger)
}

// Placeholder route setup functions (to be implemented in future phases)
func setupAuthRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}

func setupUserRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}

func setupBoardRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}

func setupTaskRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}

func setupNotificationRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}
