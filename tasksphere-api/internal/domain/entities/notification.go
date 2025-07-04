package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Notification struct {
	*Base `bson:",inline"`

	Type     NotificationType    `bson:"type" json:"type" validate:"required"`
	Channel  NotificationChannel `bson:"channel"`
	Priority Priority            `bson:"priority"`
	Status   NotificationStatus  `bson:"status"`

	RecipientID    bson.ObjectID `bson:"recipientId"`
	RecipientEmail string        `bson:"recipientEmail"`

	Subject string                 `bson:"subject"`
	Content string                 `bson:"content"`
	Data    map[string]interface{} `bson:"data,omitempty"`

	ScheduledAt *time.Time `bson:"scheduledAt,omitempty"`
	SentAt      *time.Time `bson:"sentAt,omitempty"`
	FailedAt    *time.Time `bson:"failedAt,omitempty"`
	ExpiresAt   *time.Time `bson:"expiresAt,omitempty"`

	RetryCount int    `bson:"retryCount"`
	MaxRetries int    `bson:"maxRetries"`
	LastError  string `bson:"lastError,omitempty"`

	Metadata map[string]interface{} `bson:"metadata,omitempty"`
}

type NotificationMessage struct {
	Type     NotificationType    `json:"type"`
	Channel  NotificationChannel `json:"channel"`
	Priority Priority            `json:"priority"`

	RecipientID    bson.ObjectID `json:"recipientId"`
	RecipientEmail string        `json:"recipientEmail"`
	RecipientName  string        `json:"recipientName"`

	Subject string                 `json:"subject"`
	Content string                 `json:"content"`
	Data    map[string]interface{} `json:"data,omitempty"`

	ScheduledAt *time.Time `json:"scheduledAt,omitempty"`
	ExpiresAt   *time.Time `json:"expiresAt,omitempty"`

	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

type NotificationResult struct {
	Success    bool                   `json:"success"`
	MessageID  string                 `json:"messageId,omitempty"`
	Error      error                  `json:"error,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	SentAt     time.Time              `json:"sentAt"`
	RetryAfter *time.Duration         `json:"retryAfter,omitempty"`
}

// BatchNotificationResult represents the result of batch notification delivery
type BatchNotificationResult struct {
	TotalCount   int                    `json:"totalCount"`
	SuccessCount int                    `json:"successCount"`
	FailureCount int                    `json:"failureCount"`
	Results      []*NotificationResult  `json:"results"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// Business methods
func (nm *NotificationMessage) ShouldPersist() bool {
	return nm.Priority == PriorityHigh || nm.Priority == PriorityCritical
}

func (nm *NotificationMessage) GetExpirationTime() time.Time {
	if nm.ExpiresAt != nil {
		return *nm.ExpiresAt
	}

	// Default expiration times based on type
	switch nm.Type {
	case NotificationTypeEmailVerification, NotificationTypeBoardInvite:
		return time.Now().Add(30 * time.Minute)
	default:
		return time.Now().Add(24 * time.Hour)
	}
}

func (nr *Notification) CanRetry() bool {
	return nr.Status == StatusFailed &&
		nr.RetryCount < nr.MaxRetries &&
		(nr.ExpiresAt == nil || time.Now().Before(*nr.ExpiresAt))
}

func (nr *Notification) MarkSent(messageID string) {
	nr.Status = StatusSent
	now := time.Now()
	nr.SentAt = &now
	nr.UpdateTimestamp()

	if nr.Metadata == nil {
		nr.Metadata = make(map[string]interface{})
	}
	nr.Metadata["messageId"] = messageID
}

func (nr *Notification) MarkFailed(err error, retryAfter *time.Duration) {
	nr.Status = StatusFailed
	now := time.Now()
	nr.FailedAt = &now
	nr.RetryCount++
	nr.LastError = err.Error()
	nr.UpdateTimestamp()

	if retryAfter != nil {
		nextRetry := now.Add(*retryAfter)
		nr.ScheduledAt = &nextRetry
	}
}

func (nr *Notification) MarkRetrying() {
	nr.Status = StatusRetrying
	nr.UpdateTimestamp()
}

func (nr *Notification) MarkExpired() {
	nr.Status = StatusExpired
	nr.UpdateTimestamp()
}
