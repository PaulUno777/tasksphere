package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Task struct {
	Base `bson:",inline"`

	Title       string     `bson:"title" json:"title" validate:"required,min=1,max=255"`
	Description string     `bson:"description" json:"description" validate:"required,min=1,max=5000"`
	Status      TaskStatus `bson:"status" json:"status" validate:"required,oneof=TODO IN_PROGRESS REVIEW COMPLETED ARCHIVED"`
	Priority    Priority   `bson:"priority" json:"priority" validate:"required,oneof=LOW MEDIUM HIGH"`
	DueDate     *time.Time `bson:"dueDate,omitempty" json:"dueDate,omitempty"`

	AssignedTo    *bson.ObjectID `bson:"assignedToId,omitempty" json:"assignedToId,omitempty"`
	BoardID       bson.ObjectID  `bson:"boardId" json:"boardId" validate:"required"`
	CategoryID    *bson.ObjectID `bson:"categoryId,omitempty" json:"categoryId,omitempty"`
	LastUpdatedBy *bson.ObjectID `bson:"lastUpdatedBy,omitempty" json:"lastUpdatedBy" validate:"required"`

	Comments []Comment `bson:"comments,omitempty" json:"comments,omitempty"`
}

func (t *Task) IsOverdue() bool {
	if t.DueDate == nil {
		return false
	}
	return time.Now().After(*t.DueDate) && t.Status != Completed && t.Status != Archived
}

func (t *Task) IsCompleted() bool {
	return t.Status == Completed || t.Status == Archived
}

func (t *Task) IsAssigned() bool {
	return t.AssignedTo != nil
}
