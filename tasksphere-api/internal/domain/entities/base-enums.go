package entities

type NotificationType string

const (
	NotificationTypeEmailVerification  NotificationType = "EMAIL_VERIFICATION"
	NotificationTypeBoardInvite        NotificationType = "BOARD_INVITE"
	NotificationTypeBoardWelcome       NotificationType = "BOARD_WELCOME"
	NotificationTypeMemberAdded        NotificationType = "MEMBER_ADDED"
	NotificationTypeMemberRemoved      NotificationType = "MEMBER_REMOVED"
	NotificationTypeRoleChanged        NotificationType = "ROLE_CHANGED"
	NotificationTypeTaskMention        NotificationType = "TASK_MENTION"
	NotificationTypeTaskUpdate         NotificationType = "TASK_UPDATE"
	NotificationTypeTaskComment        NotificationType = "TASK_COMMENT"
	NotificationTypeDueDatePassed      NotificationType = "DUE_DATE_PASSED"
	NotificationTypeDueDateApproaching NotificationType = "DUE_DATE_APPROACHING"
	NotificationTypeSystem             NotificationType = "SYSTEM"
)

type NotificationChannel string

const (
	ChannelEmail     NotificationChannel = "EMAIL"
	ChannelWebSocket NotificationChannel = "WEBSOCKET"
	ChannelPush      NotificationChannel = "PUSH"
	ChannelSMS       NotificationChannel = "SMS"
)

// NotificationStatus represents the delivery status
type NotificationStatus string

const (
	StatusPending  NotificationStatus = "PENDING"
	StatusSent     NotificationStatus = "SENT"
	StatusFailed   NotificationStatus = "FAILED"
	StatusRetrying NotificationStatus = "RETRYING"
	StatusExpired  NotificationStatus = "EXPIRED"
)

type TaskStatus string

const (
	TaskStatusToDo       TaskStatus = "TODO"
	TaskStatusInProgress TaskStatus = "IN_PROGRESS"
	TaskStatusReview     TaskStatus = "REVIEW"
	TaskStatusCompleted  TaskStatus = "COMPLETED"
	TaskStatusArchived   TaskStatus = "ARCHIVED"
)

// Board
type BoardStatus string

const (
	BoardStatusActive   BoardStatus = "ACTIVE"
	BoardStatusArchived BoardStatus = "ARCHIVED"
	BoardStatusDeleted  BoardStatus = "DELETED"
)

type BoardRole string

const (
	BoardRoleOwner  BoardRole = "OWNER"
	BoardRoleAdmin  BoardRole = "ADMIN"
	BoardRoleMember BoardRole = "MEMBER"
	BoardRoleGuest  BoardRole = "GUEST"
)

type MemberStatus string

const (
	MemberStatusPending  MemberStatus = "PENDING"
	MemberStatusAccepted MemberStatus = "ACCEPTED"
	MemberStatusRevoked  MemberStatus = "REVOKED"
	MemberStatusRemoved  MemberStatus = "REMOVED"
)

type InvitationStatus string

const (
	InvitationStatusPending  InvitationStatus = "PENDING"
	InvitationStatusAccepted InvitationStatus = "ACCEPTED"
	InvitationStatusRejected InvitationStatus = "REJECTED"
	InvitationStatusExpired  InvitationStatus = "EXPIRED"
)

type Priority string

const (
	PriorityLow      Priority = "LOW"
	PriorityNormal   Priority = "NORMAL"
	PriorityHigh     Priority = "HIGH"
	PriorityCritical Priority = "CRITICAL"
)

type ActivityType string

const (
	ActivityTypeTaskCreated     ActivityType = "TASK_CREATED"
	ActivityTypeTaskUpdated     ActivityType = "TASK_UPDATED"
	ActivityTypeTaskCompleted   ActivityType = "TASK_COMPLETED"
	ActivityTypeTaskReopened    ActivityType = "TASK_REOPENED"
	ActivityTypeTaskArchived    ActivityType = "TASK_ARCHIVED"
	ActivityTypeTaskRestored    ActivityType = "TASK_RESTORED"
	ActivityTypeTaskAssigned    ActivityType = "TASK_ASSIGNED"
	ActivityTypeTaskUnassigned  ActivityType = "TASK_UNASSIGNED"
	ActivityTypeTaskMoved       ActivityType = "TASK_MOVED"
	ActivityTypeCommentAdded    ActivityType = "COMMENT_ADDED"
	ActivityTypeCommentEdited   ActivityType = "COMMENT_EDITED"
	ActivityTypeCommentDeleted  ActivityType = "COMMENT_DELETED"
	ActivityTypePriorityChanged ActivityType = "PRIORITY_CHANGED"
	ActivityTypeDueDateChanged  ActivityType = "DUE_DATE_CHANGED"
	ActivityTypeCategoryChanged ActivityType = "CATEGORY_CHANGED"
)

type CommentType string

const (
	CommentTypeRegular CommentType = "REGULAR"
	CommentTypeSystem  CommentType = "SYSTEM"
)

type ReactionType string

const (
	ReactionTypeLike      ReactionType = "LIKE"
	ReactionTypeDislike   ReactionType = "DISLIKE"
	ReactionTypeHeart     ReactionType = "HEART"
	ReactionTypeLaugh     ReactionType = "LAUGH"
	ReactionTypeAngry     ReactionType = "ANGRY"
	ReactionTypeSurprised ReactionType = "SURPRISED"
)
