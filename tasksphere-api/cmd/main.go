package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/interface/routes"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/errors"
	"github.com/PaulUno777/tasksphere-api/internal/pkg/i18n"
	"github.com/gofiber/fiber/v2"
)

func main() {

	// Load configuration
	cfg := config.Load()

	// Initialize logger
	log := logger.NewLogger(cfg)
	log.Info("🚀 Starting TaskSphere Backend Server...")

	// Load i18n
	i18nManager := i18n.New()
	if err := i18nManager.LoadLocales(); err != nil {
		log.Fatalf("❌ Failed to load locales: %v", err)
	}
	log.Info("🌐 i18nManager initialized")

	// Initialize MongoDB
	db, err := mongodb.NewConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}
	defer db.Disconnect()
	log.Info("✅ MongoDB connected")

	// Initialize Redis
	redisClient, err := cache.NewRedis(&cfg.Redis, log, 0)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()
	log.Info("✅ Redis connected")

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
		ErrorHandler: errors.ErrorHandler(log),
	})

	// Setup routes
	routes.Setup(app, cfg, db, redisClient, log)

	// Start server in goroutine
	go func() {
		log.Infof("🌍 Listening on port %s", cfg.Server.Port)
		if err := app.Listen(":" + cfg.Server.Port); err != nil {
			log.Fatalf("❌ Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown on SIGINT or SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("🛑 Shutting down server...")
	if err := app.Shutdown(); err != nil {
		log.Errorf("Error during shutdown: %v", err)
	}
	log.Info("✅ Server stopped cleanly")
}
