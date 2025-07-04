package routes

import (
	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/security"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/security/oauth"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/handlers"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/auth"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/user"
	"github.com/gofiber/fiber/v2"
)

// SetupAuthRoutes sets up authentication routes
func SetupAuthRoutes(
	router fiber.Router,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *logger.Logger,
) {
	i18nService := i18n.Get()
	// Initialize repositories
	userRepo := mongodb.NewUserRepository(mongoDB)

	// Initialize domain services
	authService := security.NewJWTService(&cfg.JWT)
	oauthService := oauth.NewGoogleService(&cfg.GoogleOAuth)

	// Initialize use cases
	authUseCase := auth.NewUseCase(userRepo, authService, oauthService)
	userUseCase := user.NewUseCase(userRepo, authService, i18nService)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authUseCase, i18nService)
	userHandler := handlers.NewUserHandler(userUseCase, i18nService)

	// Public routes
	authRoutes := router.Group("/auth")
	authRoutes.Post("/register", authHandler.Register)
	authRoutes.Post("/login", authHandler.Login)
	authRoutes.Post("/refresh-token", authHandler.RefreshToken)
	authRoutes.Get("/google", authHandler.GetGoogleAuthURL)
	authRoutes.Post("/google", authHandler.GoogleAuth)

	// Protected routes
	userRoutes := router.Group("/users")
	userRoutes.Use(middleware.AuthMiddleware(authService))
	userRoutes.Get("/me", userHandler.GetProfile)
	userRoutes.Put("/me", userHandler.UpdateProfile)
	userRoutes.Put("/me/password", userHandler.UpdatePassword)
}
