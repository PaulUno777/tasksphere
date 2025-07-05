package routes

import (
	"log/slog"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/i18n"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/security"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/handlers"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/task"
	"github.com/gofiber/fiber/v2"
)

func SetupTaskRoutes(
	router fiber.Router,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *slog.Logger,
) {
	// Initialize services
	i18nService := i18n.Get()

	// Initialize repository factory
	repoFactory := mongoDB.GetRepositoryFactory()

	// Initialize repositories
	taskRepo := repoFactory.CreateTaskRepository()
	boardRepo := repoFactory.CreateBoardRepository()
	boardMemberRepo := repoFactory.CreateBoardMemberRepository()
	categoryRepo := repoFactory.CreateCategoryRepository()
	userRepo := repoFactory.CreateUserRepository()
	commentRepo := repoFactory.CreateCommentRepository()

	// Initialize domain services
	authService := security.NewJWTService(&cfg.JWT)

	// Initialize use cases
	taskUseCase := task.NewUseCase(boardMemberRepo,
		categoryRepo,
		commentRepo,
		boardRepo,
		userRepo,
		taskRepo,
	)

	// Initialize handlers
	taskHandler := handlers.NewTaskHandler(taskUseCase, i18nService)

	// Task management routes

	// Board-specific task routes
	boardTaskRoutes := router.Group("/boards/:boardId/tasks")
	boardTaskRoutes.Use(middleware.AuthMiddleware(authService))

	boardTaskRoutes.Post("/", taskHandler.CreateTask)                    // Create task
	// boardTaskRoutes.Get("/", taskHandler.GetBoardTasks)                  // List board tasks
	// boardTaskRoutes.Get("/kanban", taskHandler.GetBoardTasksKanban)      // Get kanban view

	// // Protected routes (all task routes require authentication)
	// taskRoutes := router.Group("/tasks")
	// taskRoutes.Use(middleware.AuthMiddleware(authService))

	// taskRoutes.Get("/:id", taskHandler.GetTask)                          // Get task details
	// taskRoutes.Put("/:id", taskHandler.UpdateTask)                       // Update task
	// taskRoutes.Delete("/:id", taskHandler.DeleteTask)                    // Delete task
	// taskRoutes.Put("/:id/status", taskHandler.UpdateTaskStatus)          // Update task status
	// taskRoutes.Put("/:id/assign", taskHandler.AssignTask)                // Assign/unassign task
	// taskRoutes.Put("/:id/position", taskHandler.UpdateTaskPosition)      // Update task position
	// taskRoutes.Put("/:id/archive", taskHandler.ArchiveTask)              // Archive task
	// taskRoutes.Put("/:id/restore", taskHandler.RestoreTask)              // Restore archived task


	// // User-specific task routes
	// userTaskRoutes := router.Group("/my/tasks")
	// userTaskRoutes.Use(middleware.AuthMiddleware(authService))
	
	// userTaskRoutes.Get("/", taskHandler.GetMyTasks)     
}
