package repositories

import (
	"context"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type NotificationFilter struct {
	RecipientID *bson.ObjectID
	IsRead      *bool
	Type        *entities.NotificationType
	Priority    *entities.Priority
	BoardID     *bson.ObjectID
	TaskID      *bson.ObjectID
}

type NotificationRepository interface {
	// Create a new notification
	Create(ctx context.Context, notification *entities.Notification) error

	// Get notification by ID
	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Notification, error)

	// Get notifications for a user with pagination and filtering
	GetByUserID(ctx context.Context, userID bson.ObjectID, unreadOnly bool, skip, limit int64) ([]*entities.Notification, error)

	// Update notification (for marking as read/delivered)
	Update(ctx context.Context, notification *entities.Notification) error

	// Delete notification
	Delete(ctx context.Context, id bson.ObjectID) error

	// Get unread count for a user
	GetUnreadCount(ctx context.Context, userID bson.ObjectID) (int64, error)

	// Mark all notifications as read for a user
	MarkAllAsReadForUser(ctx context.Context, userID bson.ObjectID) error

	// Get notifications that need delivery retry
	GetPendingDeliveries(ctx context.Context, maxAttempts int) ([]*entities.Notification, error)

	// Bulk update delivery status
	BulkUpdateDeliveryStatus(ctx context.Context, notificationIDs []bson.ObjectID, delivered bool) error

	// Clean up old read notifications (for maintenance)
	DeleteOldReadNotifications(ctx context.Context, olderThanDays int) (int64, error)
}
