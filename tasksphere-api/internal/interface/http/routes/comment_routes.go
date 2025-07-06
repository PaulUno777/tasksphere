package routes

import (
	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/security"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/handlers"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/comment"
	"github.com/gofiber/fiber/v2"
)

func SetupCommentRoutes(
	router fiber.Router,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *logger.Logger,
) {
	// Initialize repository factory
	repoFactory := mongoDB.GetRepositoryFactory()

	// Initialize repositories
	commentRepo := repoFactory.CreateCommentRepository()
	taskRepo := repoFactory.CreateTaskRepository()
	boardMemberRepo := repoFactory.CreateBoardMemberRepository()
	boardRepo := repoFactory.CreateBoardRepository()
	userRepo := repoFactory.CreateUserRepository()

	// Initialize domain services
	authService := security.NewJWTService(&cfg.JWT)

	// Initialize use cases
	commentUseCase := comment.NewUseCase(
		boardMemberRepo,
		commentRepo,
		boardRepo,
		taskRepo,
		userRepo,
	)

	// Initialize handlers
	commentHandler := handlers.NewCommentHandler(commentUseCase)

	// Task-specific comment routes
	taskCommentRoutes := router.Group("/tasks/:taskId/comments")
	taskCommentRoutes.Use(middleware.AuthMiddleware(authService))

	taskCommentRoutes.Post("/", commentHandler.CreateComment)  // Create comment
	taskCommentRoutes.Get("/", commentHandler.GetTaskComments) // List task comments

	// Protected routes (all comment routes require authentication)
	commentRoutes := router.Group("/comments")
	commentRoutes.Use(middleware.AuthMiddleware(authService))

	// Comment management routes
	commentRoutes.Get("/:id", commentHandler.GetComment)                         // Get comment details
	commentRoutes.Put("/:id", commentHandler.UpdateComment)                      // Update comment
	commentRoutes.Delete("/:id", commentHandler.DeleteComment)                   // Delete comment
	commentRoutes.Post("/:id/reactions", commentHandler.AddReaction)             // Add reaction
	commentRoutes.Delete("/:id/reactions/:emoji", commentHandler.RemoveReaction) // Remove reaction

	// User-specific comment routes
	userCommentRoutes := router.Group("/my/mentions")
	userCommentRoutes.Use(middleware.AuthMiddleware(authService))

	userCommentRoutes.Get("/", commentHandler.GetUserMentions) // Get user's mentions
}
