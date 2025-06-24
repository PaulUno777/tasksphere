package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Task struct {
	BaseEntity `bson:",inline"`

	Title       string     `bson:"title" json:"title"`
	Description string     `bson:"description" json:"description"`
	Status      TaskStatus `bson:"status" json:"status"`
	Priority    Priority   `bson:"priority" json:"priority"`
	DueDate     *time.Time `bson:"dueDate,omitempty" json:"dueDate,omitempty"`

	AssignedToID  *bson.ObjectID  `bson:"assignedToId,omitempty" json:"assignedToId,omitempty"`
	BoardID       bson.ObjectID   `bson:"boardId" json:"boardId"`
	CategoryID    *bson.ObjectID  `bson:"categoryId,omitempty" json:"categoryId,omitempty"`
	Comments      []bson.ObjectID `bson:"comments,omitempty" json:"comments,omitempty"`
	LastUpdatedBy *bson.ObjectID  `bson:"lastUpdatedBy,omitempty" json:"lastUpdatedBy,omitempty"`
}
