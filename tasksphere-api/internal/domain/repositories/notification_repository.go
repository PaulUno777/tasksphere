package repositories

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type NotificationStatistics struct {
	TotalSent    int64                                  `json:"totalSent"`
	TotalFailed  int64                                  `json:"totalFailed"`
	TotalPending int64                                  `json:"totalPending"`
	TotalExpired int64                                  `json:"totalExpired"`
	ByChannel    map[entities.NotificationChannel]int64 `json:"byChannel"`
	ByType       map[entities.NotificationType]int64    `json:"byType"`
	ByPriority   map[entities.Priority]int64            `json:"byPriority"`
}

type NotificationRepository interface {
	// Save saves a notification record
	Save(ctx context.Context, record *entities.Notification) (*entities.Notification, error)

	GetByID(ctx context.Context, id bson.ObjectID) (*entities.Notification, error)

	Update(ctx context.Context, record *entities.Notification) error

	GetPendingRetries(ctx context.Context, limit int) ([]*entities.Notification, error)

	GetExpired(ctx context.Context, before time.Time, limit int) ([]*entities.Notification, error)

	Delete(ctx context.Context, ids []bson.ObjectID) error

	GetByRecipient(ctx context.Context, recipientID bson.ObjectID, limit int) ([]*entities.Notification, error)

	GetStatistics(ctx context.Context, from, to time.Time) (*NotificationStatistics, error)
}
