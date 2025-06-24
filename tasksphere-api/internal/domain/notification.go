package domain

import "go.mongodb.org/mongo-driver/v2/bson"

type Notification struct {
	BaseEntity `bson:",inline"`

	Type        NotificationType `bson:"type" json:"type"`
	Content     string           `bson:"content" json:"content"`
	Priority    Priority         `bson:"priority" json:"priority"`
	IsRead      bool             `bson:"isRead" json:"isRead"`
	IsDelivered bool             `bson:"isDelivered" json:"isDelivered"`
	RecipientID bson.ObjectID    `bson:"recipientId" json:"recipientId"`
	BoardID     *bson.ObjectID   `bson:"boardId,omitempty" json:"boardId,omitempty"`
	TaskID      *bson.ObjectID   `bson:"taskId,omitempty" json:"taskId,omitempty"`
	Delivered   bool             `bson:"delivered" json:"delivered"`
}
