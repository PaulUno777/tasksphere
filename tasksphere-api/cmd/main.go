package main

import (
	"fmt"
	"log"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/delivery/router"
	"github.com/PaulUno777/tasksphere-api/pkg/logger"
	"github.com/gofiber/fiber/v2"
)

func main() {
	// Init logger BEFORE everything else
	logger.InitLogger()

	cfg := config.LoadConfig()

	app := fiber.New()

	// MongoDB setup
	db := config.ConnectMongo(cfg.MongoURI, cfg.MongoDatabase)

	//health check
	app.Get("health/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// Routes
	router.SetupRoutes(app, db)

	// Start server
	port := cfg.Port
	log.Printf("Server running on http://localhost:%d", port)
	log.Fatal(app.Listen(fmt.Sprintf(":%d", port)))
}
