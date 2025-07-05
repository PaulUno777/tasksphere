package entities

import "go.mongodb.org/mongo-driver/v2/bson"

type TaskActivity struct {
	*Base `bson:",inline"`

	Type        ActivityType  `bson:"type"`
	TaskID      bson.ObjectID `bson:"taskId"`
	PerformedBy bson.ObjectID `bson:"performedBy"`

	// Activity details (stored as BSON for flexibility)
	Details  map[string]interface{} `bson:"details,omitempty"`
	OldValue interface{}            `bson:"oldValue,omitempty"`
	NewValue interface{}            `bson:"newValue,omitempty"`

	// Optional references
	CommentID  *bson.ObjectID `bson:"commentId,omitempty"`
	AssigneeID *bson.ObjectID `bson:"assigneeId,omitempty"`
}


// Business methods for TaskActivity
func (ta *TaskActivity) IsTaskStatusChange() bool {
	return ta.Type == ActivityTypeTaskCompleted ||
		ta.Type == ActivityTypeTaskReopened ||
		ta.Type == ActivityTypeTaskArchived ||
		ta.Type == ActivityTypeTaskRestored
}

func (ta *TaskActivity) IsAssignmentChange() bool {
	return ta.Type == ActivityTypeTaskAssigned || ta.Type == ActivityTypeTaskUnassigned
}

func (ta *TaskActivity) IsCommentActivity() bool {
	return ta.Type == ActivityTypeCommentAdded ||
		ta.Type == ActivityTypeCommentEdited ||
		ta.Type == ActivityTypeCommentDeleted
}

func (ta *TaskActivity) SetDetails(key string, value interface{}) {
	if ta.Details == nil {
		ta.Details = make(map[string]interface{})
	}
	ta.Details[key] = value
}

func (ta *TaskActivity) GetDetail(key string) interface{} {
	if ta.Details == nil {
		return nil
	}
	return ta.Details[key]
}