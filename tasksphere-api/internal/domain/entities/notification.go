package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Notification struct {
	Base `bson:",inline"`

	Type     NotificationType `bson:"type" json:"type" validate:"required"`
	Content  string           `bson:"content" json:"content" validate:"required,min=1,max=500"`
	Priority Priority         `bson:"priority" json:"priority" validate:"required,oneof=LOW MEDIUM HIGH"`

	IsRead           bool `bson:"isRead" json:"isRead"`
	IsDelivered      bool `bson:"isDelivered" json:"isDelivered"`
	DeliveryAttempts int  `bson:"deliveryAttempts" json:"deliveryAttempts"`

	RecipientID bson.ObjectID  `bson:"recipientId" json:"recipientId" validate:"required"`
	BoardID     *bson.ObjectID `bson:"boardId,omitempty" json:"boardId,omitempty"`
	TaskID      *bson.ObjectID `bson:"taskId,omitempty" json:"taskId,omitempty"`

	// Cleanup tracking - notifications are deleted after expiry
	ExpiresAt time.Time `bson:"expiresAt" json:"expiresAt"`
}

func (n *Notification) MarkAsRead() {
	if !n.IsRead {
		n.IsRead = true
		n.UpdatedAt = time.Now()
	}
}

func (n *Notification) MarkAsDelivered() {
	n.IsDelivered = true
	n.UpdatedAt = time.Now()
}

func (n *Notification) IncrementDeliveryAttempts() {
	n.DeliveryAttempts++
	n.UpdatedAt = time.Now()
}

// ShouldRetryDelivery determines if delivery should be retried based on attempts and priority
func (n *Notification) ShouldRetryDelivery() bool {
	maxAttempts := 3
	if n.IsHighPriority() {
		maxAttempts = 5
	}
	return n.DeliveryAttempts < maxAttempts
}

// GetContextIDs returns the board and task IDs for routing purposes
func (n *Notification) GetContextIDs() (boardID *bson.ObjectID, taskID *bson.ObjectID) {
	return n.BoardID, n.TaskID
}

// IsHighPriority checks if the notification requires immediate attention
func (n *Notification) IsHighPriority() bool {
	return n.Priority == PriorityHigh
}

// IsExpired checks if the notification has expired and should be cleaned up
func (n *Notification) IsExpired() bool {
	return time.Now().After(n.ExpiresAt)
}

// SetExpiry sets the expiration time (default 30 days from creation)
func (n *Notification) SetExpiry(days int) {
	if days < 1 {
		days = 7 // Default 7 days
	}
	n.ExpiresAt = n.CreatedAt.AddDate(0, 0, days)
}
