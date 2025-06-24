package domain

type NotificationType string

const (
	BoardInvite   NotificationType = "BOARD_INVITE"
	TaskAssigned  NotificationType = "TASK_ASSIGNED"
	TaskUpdate    NotificationType = "TASK_UPDATE"
	TaskComment   NotificationType = "TASK_COMMENT"
	DueDatePassed NotificationType = "DUE_DATE_PASSED"
)

type Priority string

const (
	Low    Priority = "LOW"
	Medium Priority = "MEDIUM"
	High   Priority = "HIGH"
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
	Admin  BoardRole = "ADMIN"
	Editor BoardRole = "EDITOR"
	Viewer BoardRole = "VIEWER"
)
