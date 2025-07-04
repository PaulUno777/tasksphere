package mongodb

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// NotificationRepository implements the notification repository interface
type NotificationRepository struct {
	collection *mongo.Collection
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *Connection) repositories.NotificationRepository {
	return &NotificationRepository{
		collection: db.GetCollection("notifications"),
	}
}

// Save implements repositories.NotificationRepository.
func (n *NotificationRepository) Save(ctx context.Context, record *entities.Notification) (*entities.Notification, error) {
	panic("unimplemented")
}

// GetByID implements repositories.NotificationRepository.
func (n *NotificationRepository) GetByID(ctx context.Context, id bson.ObjectID) (*entities.Notification, error) {
	panic("unimplemented")
}

// GetByRecipient implements repositories.NotificationRepository.
func (n *NotificationRepository) GetByRecipient(ctx context.Context, recipientID bson.ObjectID, limit int) ([]*entities.Notification, error) {
	panic("unimplemented")
}

// GetExpired implements repositories.NotificationRepository.
func (n *NotificationRepository) GetExpired(ctx context.Context, before time.Time, limit int) ([]*entities.Notification, error) {
	panic("unimplemented")
}

// GetPendingRetries implements repositories.NotificationRepository.
func (n *NotificationRepository) GetPendingRetries(ctx context.Context, limit int) ([]*entities.Notification, error) {
	panic("unimplemented")
}

// GetStatistics implements repositories.NotificationRepository.
func (n *NotificationRepository) GetStatistics(ctx context.Context, from time.Time, to time.Time) (*repositories.NotificationStatistics, error) {
	panic("unimplemented")
}

// Update implements repositories.NotificationRepository.
func (n *NotificationRepository) Update(ctx context.Context, record *entities.Notification) error {
	panic("unimplemented")
}

// Delete implements repositories.NotificationRepository.
func (n *NotificationRepository) Delete(ctx context.Context, ids []bson.ObjectID) error {
	panic("unimplemented")
}
