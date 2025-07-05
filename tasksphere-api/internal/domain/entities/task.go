package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Task struct {
	*Base `bson:",inline"`

	Title       string         `bson:"title"`
	Description *string        `bson:"description"`
	Status      TaskStatus     `bson:"status"`
	Priority    Priority       `bson:"priority"`
	BoardID     bson.ObjectID  `bson:"boardId"`
	CategoryID  *bson.ObjectID `bson:"categoryId,omitempty"`

	CreatedBy  bson.ObjectID  `bson:"createdBy"`
	AssignedTo *bson.ObjectID `bson:"assignedToId,omitempty"`

	DueDate     *time.Time `bson:"dueDate,omitempty"`
	StartDate   *time.Time `bson:"startDate,omitempty"`
	CompletedAt *time.Time `bson:"completedAt,omitempty"`
	ArchivedAt  *time.Time `bson:"archivedAt,omitempty"`

	Position     int            `bson:"position"`
	LastEditedBy *bson.ObjectID `bson:"lastEditedBy"`
}

// Business methods for Task
func (t *Task) IsCompleted() bool {
	return t.Status == TaskStatusCompleted
}

func (t *Task) IsArchived() bool {
	return t.Status == TaskStatusArchived
}

func (t *Task) IsOverdue() bool {
	if t.DueDate == nil || t.IsCompleted() || t.IsArchived() {
		return false
	}
	return time.Now().After(*t.DueDate)
}

func (t *Task) CanBeEdited() bool {
	return !t.IsArchived()
}

func (t *Task) Complete(userID bson.ObjectID) {
	t.Status = TaskStatusCompleted
	now := time.Now()
	t.CompletedAt = &now
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}

func (t *Task) Reopen(userID bson.ObjectID) {
	if t.Status == TaskStatusCompleted {
		t.Status = TaskStatusToDo
		t.CompletedAt = nil
		t.LastEditedBy = &userID
		t.UpdateTimestamp()
	}
}

func (t *Task) Archive(userID bson.ObjectID) {
	t.Status = TaskStatusArchived
	now := time.Now()
	t.ArchivedAt = &now
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}

func (t *Task) Restore(userID bson.ObjectID) {
	if t.Status == TaskStatusArchived {
		t.Status = TaskStatusToDo
		t.ArchivedAt = nil
		t.LastEditedBy = &userID
		t.UpdateTimestamp()
	}
}

func (t *Task) UpdateStatus(status TaskStatus, userID bson.ObjectID) {
	t.Status = status
	t.LastEditedBy = &userID

	// Handle completion
	if status == TaskStatusCompleted && t.CompletedAt == nil {
		now := time.Now()
		t.CompletedAt = &now
	} else if status != TaskStatusCompleted {
		t.CompletedAt = nil
	}

	t.UpdateTimestamp()
}

func (t *Task) AssignTo(userID *bson.ObjectID, editorID bson.ObjectID) {
	t.AssignedTo = userID
	t.LastEditedBy = &editorID
	t.UpdateTimestamp()
}

func (t *Task) UpdatePriority(priority Priority, userID bson.ObjectID) {
	t.Priority = priority
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}

func (t *Task) SetDueDate(dueDate *time.Time, userID bson.ObjectID) {
	t.DueDate = dueDate
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}

func (t *Task) SetStartDate(startDate *time.Time, userID bson.ObjectID) {
	t.StartDate = startDate
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}

func (t *Task) UpdatePosition(position int, userID bson.ObjectID) {
	t.Position = position
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}

func (t *Task) AssignCategory(categoryID *bson.ObjectID, userID bson.ObjectID) {
	t.CategoryID = categoryID
	t.LastEditedBy = &userID
	t.UpdateTimestamp()
}
