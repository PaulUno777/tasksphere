package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Task struct {
	*Base `bson:",inline"`

	Title       string     `bson:"title"`
	Description string     `bson:"description"`
	Status      TaskStatus `bson:"status"`
	Priority    Priority   `bson:"priority"`
	DueDate     *time.Time `bson:"dueDate,omitempty"`

	AssignedTo    *bson.ObjectID `bson:"assignedToId,omitempty"`
	BoardID       bson.ObjectID  `bson:"boardId"`
	CategoryID    *bson.ObjectID `bson:"categoryId,omitempty"`
	LastUpdatedBy *bson.ObjectID `bson:"lastUpdatedBy,omitempty"`
}

func (t *Task) IsOverdue() bool {
	if t.DueDate == nil {
		return false
	}
	return time.Now().After(*t.DueDate) && t.Status != TaskStatusCompleted && t.Status != TaskStatusArchived
}

func (t *Task) IsCompleted() bool {
	return t.Status == TaskStatusCompleted || t.Status == TaskStatusArchived
}

func (t *Task) IsAssigned() bool {
	return t.AssignedTo != nil
}
