package middleware

import (
	"strings"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORS returns CORS middleware
func CORS(config config.Config) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     strings.Join(config.Server.CORSOrigins, ","),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With",
		ExposeHeaders:    "Content-Length",
		AllowCredentials: true,
	})
}
