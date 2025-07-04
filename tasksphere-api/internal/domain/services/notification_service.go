package services

import (
	"context"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

// FormattedMessage represents a formatted notification message
type FormattedMessage struct {
	Subject     string                 `json:"subject"`
	Content     string                 `json:"content"`
	ContentType string                 `json:"contentType"` // "text/plain", "text/html"
	Attachments []*MessageAttachment   `json:"attachments,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// MessageAttachment represents a file attachment
type MessageAttachment struct {
	Name        string `json:"name"`
	Content     []byte `json:"content"`
	ContentType string `json:"contentType"`
}

type MessageFormatter interface {
	// Format formats a notification message for a specific channel
	Format(ctx context.Context, message *entities.NotificationMessage) (*FormattedMessage, error)

	// GetSupportedTypes returns the notification types this formatter supports
	GetSupportedTypes() []entities.NotificationType

	// GetChannel returns the channel this formatter is for
	GetChannel() entities.NotificationChannel
}


type Notifier interface {
	// GetChannel returns the channel this notifier handles
	GetChannel() entities.NotificationChannel
	// Send sends a single notification
	Send(ctx context.Context, message *entities.NotificationMessage) (*entities.NotificationResult, error)
	// SendBatch sends multiple notifications efficiently
	SendBatch(ctx context.Context, messages []*entities.NotificationMessage) (*entities.BatchNotificationResult, error)
	// IsHealthy checks if the notifier is operational
	IsHealthy(ctx context.Context) error
}

type NotificationService interface {
	Send(ctx context.Context, message *entities.NotificationMessage) (*entities.NotificationResult, error)
	SendBatch(ctx context.Context, messages []*entities.NotificationMessage) (*entities.BatchNotificationResult, error)
	// RegisterNotifier registers a new notification channel
	RegisterNotifier(notifier Notifier) error
	// RegisterFormatter registers a message formatter
	RegisterFormatter(formatter MessageFormatter) error
	// GetAvailableChannels returns available notification channels
	GetAvailableChannels() []entities.NotificationChannel

	// ProcessRetries processes failed notifications for retry
	ProcessRetries(ctx context.Context) error
	// CleanupExpired removes expired notification records
	CleanupExpired(ctx context.Context) error
}

type RetryPolicy interface {
	// ShouldRetry determines if a notification should be retried
	ShouldRetry(record *entities.Notification, err error) bool

	// GetRetryDelay returns the delay before next retry
	GetRetryDelay(record *entities.Notification) *time.Duration

	// GetMaxRetries returns the maximum number of retries
	GetMaxRetries(priority entities.Priority) int
}
