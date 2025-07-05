package routes

import (
	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/security"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/handlers"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/category"
	"github.com/gofiber/fiber/v2"
)

func SetupCategoryRoutes(
	router fiber.Router,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *logger.Logger,
) {
	// Initialize services
	i18nService := i18n.Get()

	// Initialize repository factory
	repoFactory := mongoDB.GetRepositoryFactory()

	// Initialize repositories
	categoryRepo := repoFactory.CreateCategoryRepository()
	boardRepo := repoFactory.CreateBoardRepository()
	boardMemberRepo := repoFactory.CreateBoardMemberRepository()
	userRepo := repoFactory.CreateUserRepository()
	taskRepo := repoFactory.CreateTaskRepository()

	// Initialize domain services
	authService := security.NewJWTService(&cfg.JWT)

	// Initialize use cases
	categoryUseCase := category.NewUseCase(
		boardMemberRepo,
		categoryRepo,
		boardRepo,
		taskRepo,
		userRepo,
	)

	// Initialize handlers
	categoryHandler := handlers.NewCategoryHandler(categoryUseCase, i18nService)

	// Category management routes

	// Board-specific category routes
	boardCategoryRoutes := router.Group("/boards/:boardId/categories")
	boardCategoryRoutes.Use(middleware.AuthMiddleware(authService))
	boardCategoryRoutes.Post("/", categoryHandler.CreateCategory)    // Create category
	boardCategoryRoutes.Get("/", categoryHandler.GetBoardCategories) // List board categories

	// Protected routes (all category routes require authentication)
	categoryRoutes := router.Group("/categories")
	categoryRoutes.Use(middleware.AuthMiddleware(authService))
	categoryRoutes.Get("/:id", categoryHandler.GetCategory)                      // Get category details
	categoryRoutes.Put("/:id", categoryHandler.UpdateCategory)                   // Update category
	categoryRoutes.Delete("/:id", categoryHandler.DeleteCategory)                // Delete category
	categoryRoutes.Put("/:id/position", categoryHandler.UpdateCategoryPosition)  // Update category position
	categoryRoutes.Put("/:id/toggle-active", categoryHandler.ToggleActiveStatus) // Deactivate category
}
