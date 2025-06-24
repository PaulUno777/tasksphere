package router

import (
	"github.com/PaulUno777/tasksphere-api/internal/delivery/http"
	"github.com/gofiber/fiber/v2"
)

func SetupAuthRoutes(app fiber.Router, handler *http.AuthHandler) {
	auth := app.Group("/auth")
	auth.Post("/register", handler.Register)
	auth.Post("/login", handler.Login)
	auth.Post("/refresh-token", handler.RefreshToken)
}
