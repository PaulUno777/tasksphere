package router

import (
	"github.com/PaulUno777/tasksphere-api/internal/delivery/http"
	"github.com/PaulUno777/tasksphere-api/internal/delivery/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/domain"
	"github.com/gofiber/fiber/v2"
)

func SetupUserRoutes(app fiber.Router, handler *http.UserHandler, userRepo domain.UserRepository) {
	auth := app.Group("/users", middleware.JWTAuth(userRepo))
	auth.Get("/me", handler.GetProfile)
	auth.Put("/me", handler.UpdateProfile)
}
