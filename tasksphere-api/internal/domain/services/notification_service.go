package services

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type CreateNotificationRequest struct {
	Type        entities.NotificationType `json:"type" validate:"required"`
	Content     string                    `json:"content" validate:"required,min=1,max=500"`
	Priority    entities.Priority         `json:"priority" validate:"required"`
	RecipientID bson.ObjectID             `json:"recipient_id" validate:"required"`
	BoardID     *bson.ObjectID            `json:"board_id,omitempty"`
	TaskID      *bson.ObjectID            `json:"task_id,omitempty"`
	Metadata    map[string]interface{}    `json:"metadata,omitempty"`
}

type NotificationWithDetails struct {
	Notification *entities.Notification `json:"notification"`
	Board        *entities.Board        `json:"board,omitempty"`
	Task         *entities.Task         `json:"task,omitempty"`
}

type NotificationService interface {
	// CreateNotification creates and persists a new notification
	CreateNotification(ctx context.Context, notification *entities.Notification) error

	// GetUserNotifications retrieves notifications for a user with pagination
	GetUserNotifications(ctx context.Context, userID bson.ObjectID, limit int) ([]*entities.Notification, error)

	// MarkAsRead marks a persisted notification as read
	MarkAsRead(ctx context.Context, notificationID, userID bson.ObjectID) error

	// MarkAllAsRead marks all persisted notifications as read for a user
	MarkAllAsRead(ctx context.Context, userID bson.ObjectID) error

	// GetUnreadCount returns count of unread persisted notifications
	GetUnreadCount(ctx context.Context, userID bson.ObjectID) (int64, error)

	// DeleteNotification removes a persisted notification
	DeleteNotification(ctx context.Context, notificationID, userID bson.ObjectID) error

	// CleanupOldNotifications removes old persisted notifications (system cleanup)
	CleanupOldNotifications(ctx context.Context, olderThan int) error
}

// RealtimeNotificationService defines the interface for real-time notification delivery
// This handles the actual delivery of notifications through various channels
type RealtimeNotificationService interface {
	// SendNotification sends a notification to a user through available channels
	SendNotification(ctx context.Context, notification *entities.Notification) error

	// SendBoardNotification sends a notification to all members of a board
	SendBoardNotification(ctx context.Context, boardID bson.ObjectID, notification *entities.Notification, excludeUserID *bson.ObjectID) error

	// IsUserOnline checks if a user is currently online
	IsUserOnline(ctx context.Context, userID bson.ObjectID) bool

	// GetOnlineUsers returns a list of currently online users
	GetOnlineUsers(ctx context.Context) []bson.ObjectID

	// GetUserConnectionCount returns the number of active connections for a user
	GetUserConnectionCount(ctx context.Context, userID bson.ObjectID) int
}

// BoardMembershipService defines the interface for checking board memberships
// This is used for message routing to ensure only board members receive relevant notifications
type BoardMembershipService interface {
	// GetBoardMembers returns all member IDs for a board
	GetBoardMembers(ctx context.Context, boardID bson.ObjectID) ([]bson.ObjectID, error)

	// IsBoardMember checks if a user is a member of a board
	IsBoardMember(ctx context.Context, boardID, userID bson.ObjectID) (bool, error)

	// GetUserBoards returns all board IDs where the user is a member
	GetUserBoards(ctx context.Context, userID bson.ObjectID) ([]bson.ObjectID, error)
}
