package router

import (
	"github.com/PaulUno777/tasksphere-api/internal/delivery/http"
	"github.com/PaulUno777/tasksphere-api/internal/delivery/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/repository/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/auth"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

func SetupRoutes(app *fiber.App, db *mongo.Database) {
	api := app.Group("/api", middleware.RequestLogger())

	// Setup nested route groups
	userRepo := mongodb.NewUserMongoRepo(db)
	authUseCase := auth.NewAuthUseCase(userRepo)
	authHandler := http.NewAuthHandler(authUseCase)
	SetupAuthRoutes(api, authHandler)

	userHandler := http.NewUserHandler(userRepo)
	SetupUserRoutes(api, userHandler, userRepo)

}
