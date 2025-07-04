package routes

import (
	"strings"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func Setup(
	app *fiber.App,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *logger.Logger,
	i18nService services.I18nService,
) {
	// Recovery middleware (should be first)
	app.Use(middleware.Recovery(logger))

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.Server.CORSOrigins, ","),
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With,Accept-Language",
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
	SetupAuthRoutes(api, cfg, mongoDB, redisClient, logger)
	SetupBoardRoutes(api, cfg, mongoDB, redisClient, logger)

	setupUserRoutes(api, cfg, mongoDB, redisClient, logger)

	setupTaskRoutes(api, cfg, mongoDB, redisClient, logger)
	setupNotificationRoutes(api, cfg, mongoDB, redisClient, logger)
}

func setupUserRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}


func setupTaskRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}

func setupNotificationRoutes(api fiber.Router, cfg *config.Config, db *mongodb.Connection, cache *cache.Connection, logger *logger.Logger) {
	// TODO: Implement in Phase 2
}
