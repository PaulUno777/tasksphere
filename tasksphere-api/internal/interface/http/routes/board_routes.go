package routes

import (
	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/cache"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/database/mongodb"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/notifications"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/security"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/handlers"
	"github.com/PaulUno777/tasksphere-api/internal/interface/http/middleware"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/board"
	"github.com/PaulUno777/tasksphere-api/internal/usecase/notification"
	"github.com/gofiber/fiber/v2"
)

func SetupBoardRoutes(
	router fiber.Router,
	cfg *config.Config,
	mongoDB *mongodb.Connection,
	redisClient *cache.Connection,
	logger *logger.Logger,
) {
	// Initialize services

	// Initialize repositories
	userRepo := mongodb.NewUserRepository(mongoDB)
	boardRepo := mongodb.NewBoardRepository(mongoDB)
	memberRepo := mongodb.NewBoardMemberRepository(mongoDB)
	invitationRepo := mongodb.NewBoardInvitationRepository(mongoDB)
	notificationRepo := mongodb.NewNotificationRepository(mongoDB)

	// Initialize domain services
	authService := security.NewJWTService(&cfg.JWT)
	retryPolicy := notifications.NewExponentialRetryPolicy()
	notificationService := notifications.NewNotificationService(notificationRepo, retryPolicy)

	// Initialize use cases
	notification := notification.NewUseCase(notificationService, notificationRepo, userRepo)
	boardUseCase := board.NewUseCase(boardRepo, memberRepo, invitationRepo, userRepo, notification)
	memberUseCase := board.NewMemberUseCase(boardRepo, memberRepo, userRepo)

	// Initialize handlers
	boardHandler := handlers.NewBoardHandler(boardUseCase, memberUseCase)

	// Protected routes (all board routes require authentication)
	boardRoutes := router.Group("/boards")
	boardRoutes.Use(middleware.AuthMiddleware(authService))
	// Board management routes
	boardRoutes.Post("/", boardHandler.CreateBoard)                    // Create board
	boardRoutes.Get("/", boardHandler.ListBoards)                      // List user's boards
	boardRoutes.Get("/:id", boardHandler.GetBoard)                     // Get board details
	boardRoutes.Put("/:id", boardHandler.UpdateBoard)                  // Update board
	boardRoutes.Put("/:id/settings", boardHandler.UpdateBoardSettings) // Update board settings
	boardRoutes.Put("/:id/archive", boardHandler.ArchiveBoard)         // Archive board
	boardRoutes.Put("/:id/restore", boardHandler.RestoreBoard)         // Restore board
	boardRoutes.Delete("/:id", boardHandler.DeleteBoard)               // Delete board
	boardRoutes.Get("/:id/stats", boardHandler.GetBoardStats)          // Get board statistics

	// Member management routes
	boardRoutes.Get("/:id/members", boardHandler.GetBoardMembers) // List board members
	boardRoutes.Post("/:id/members/invite", boardHandler.InviteMember)                     // Invite single member
	boardRoutes.Post("/:id/members/invite-multiple", boardHandler.InviteMembers)           // Invite multiple members
	boardRoutes.Put("/:id/members/:memberId/role", boardHandler.UpdateMemberRole)          // Update member role
	boardRoutes.Delete("/:id/members/:memberId", boardHandler.RemoveMember)                // Remove member
	boardRoutes.Post("/:id/leave", boardHandler.LeaveBoard)                                // Leave board
	boardRoutes.Put("/:id/members/notifications", boardHandler.UpdateNotificationSettings) // Update notification settings

	// Invitation management routes
	inviteRoutes := router.Group("/invitations")
	inviteRoutes.Use(middleware.AuthMiddleware(authService))
	inviteRoutes.Post("/accept", boardHandler.AcceptInvitation) // Accept invitation
	inviteRoutes.Post("/reject", boardHandler.RejectInvitation) // Reject invitation
}
