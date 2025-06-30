package entities

type NotificationType string

const (
	// Board-related notifications
	NotificationTypeBoardInvite   NotificationType = "BOARD_INVITE"   // User invited to board
	NotificationTypeBoardUpdate   NotificationType = "BOARD_UPDATE"   // Board details updated
	NotificationTypeBoardDeleted  NotificationType = "BOARD_DELETED"  // Board was deleted
	NotificationTypeMemberAdded   NotificationType = "MEMBER_ADDED"   // New member added to board
	NotificationTypeMemberRemoved NotificationType = "MEMBER_REMOVED" // Member removed from board
	NotificationTypeRoleChanged   NotificationType = "ROLE_CHANGED"   // User's role changed in board

	// Task-related notifications
	NotificationTypeTaskAssigned        NotificationType = "TASK_ASSIGNED"         // Task assigned to user
	NotificationTypeTaskUnassigned      NotificationType = "TASK_UNASSIGNED"       // Task unassigned from user
	NotificationTypeTaskUpdate          NotificationType = "TASK_UPDATE"           // Task details updated
	NotificationTypeTaskDeleted         NotificationType = "TASK_DELETED"          // Task was deleted
	NotificationTypeTaskComment         NotificationType = "TASK_COMMENT"          // New comment on task
	NotificationTypeTaskStatusChanged   NotificationType = "TASK_STATUS_CHANGED"   // Task status changed
	NotificationTypeTaskPriorityChanged NotificationType = "TASK_PRIORITY_CHANGED" // Task priority changed
	NotificationTypeDueDatePassed       NotificationType = "DUE_DATE_PASSED"       // Task due date has passed
	NotificationTypeDueDateApproaching  NotificationType = "DUE_DATE_APPROACHING"  // Task due date approaching

	// Category-related notifications
	NotificationTypeCategoryCreated NotificationType = "CATEGORY_CREATED" // New category created
	NotificationTypeCategoryDeleted NotificationType = "CATEGORY_DELETED" // Category deleted

	// System notifications
	NotificationTypeSystemMaintenance NotificationType = "SYSTEM_MAINTENANCE" // System maintenance notice
	NotificationTypeSystemUpdate      NotificationType = "SYSTEM_UPDATE"      // System update notice
)

// Priority represents notification priority levels
type Priority string

const (
	PriorityLow    Priority = "LOW"
	PriorityMedium Priority = "MEDIUM"
	PriorityHigh   Priority = "HIGH"
)

type TaskStatus string

const (
	Todo       TaskStatus = "TODO"
	InProgress TaskStatus = "IN_PROGRESS"
	Review     TaskStatus = "REVIEW"
	Completed  TaskStatus = "COMPLETED"
	Archived   TaskStatus = "ARCHIVED"
)

type BoardRole string

const (
	AdminRole  BoardRole = "ADMIN"
	EditorRole BoardRole = "EDITOR"
	ViewerRole BoardRole = "VIEWER"
)
