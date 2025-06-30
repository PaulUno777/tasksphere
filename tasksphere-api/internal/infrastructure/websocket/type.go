package websocket

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
)

type WebSocketMessageType string

const (
	// Client to Server messages
	MessageTypeAuth             WebSocketMessageType = "auth"              // Authentication with token
	MessageTypeSubscribeBoard   WebSocketMessageType = "subscribe_board"   // Subscribe to board updates
	MessageTypeUnsubscribeBoard WebSocketMessageType = "unsubscribe_board" // Unsubscribe from board updates
	MessageTypeMarkRead         WebSocketMessageType = "mark_read"         // Mark notification as read
	MessageTypeMarkAllRead      WebSocketMessageType = "mark_all_read"     // Mark all notifications as read
	MessageTypePing             WebSocketMessageType = "ping"              // Ping for connection health
	MessageTypeTyping           WebSocketMessageType = "typing"            // User typing indicator

	// Server to Client messages
	MessageTypeNotification     WebSocketMessageType = "notification"      // New notification
	MessageTypeNotificationRead WebSocketMessageType = "notification_read" // Notification marked as read
	MessageTypeBoardUpdate      WebSocketMessageType = "board_update"      // Board-related update
	MessageTypeTaskUpdate       WebSocketMessageType = "task_update"       // Task-related update
	MessageTypeUserTyping       WebSocketMessageType = "user_typing"       // Another user is typing
	MessageTypePong             WebSocketMessageType = "pong"              // Pong response
	MessageTypeError            WebSocketMessageType = "error"             // Error message
	MessageTypeConnected        WebSocketMessageType = "connected"         // Connection established
	MessageTypeDisconnected     WebSocketMessageType = "disconnected"      // Connection lost
)

// WebSocketMessage represents a WebSocket message structure
type WebSocketMessage struct {
	Type      WebSocketMessageType `json:"type"`
	Data      interface{}          `json:"data,omitempty"`
	Timestamp time.Time            `json:"timestamp"`
	MessageID string               `json:"messageId,omitempty"` // For message acknowledgment
}

// Client-to-Server message payloads

// AuthPayload for authentication messages
type AuthPayload struct {
	Token string `json:"token" validate:"required"`
}

// SubscribeBoardPayload for board subscription
type SubscribeBoardPayload struct {
	BoardID string `json:"boardId" validate:"required,objectid"`
}

// MarkReadPayload for marking notifications as read
type MarkReadPayload struct {
	NotificationID string `json:"notificationId" validate:"required,objectid"`
}

// TypingPayload for typing indicators
type TypingPayload struct {
	TaskID string `json:"taskId" validate:"required,objectid"`
}

// Server-to-Client message payloads

// NotificationPayload represents a notification sent to client
type NotificationPayload struct {
	ID        string                    `json:"id"`
	Type      entities.NotificationType `json:"type"`
	Content   string                    `json:"content"`
	Priority  entities.Priority         `json:"priority"`
	IsRead    bool                      `json:"isRead"`
	BoardID   *string                   `json:"boardId,omitempty"`
	TaskID    *string                   `json:"taskId,omitempty"`
	CreatedAt time.Time                 `json:"createdAt"`
}

// BoardUpdatePayload for board-related updates
type BoardUpdatePayload struct {
	BoardID     string      `json:"boardId"`
	UpdateType  string      `json:"updateType"` // created, updated, deleted, member_added, etc.
	UpdatedBy   string      `json:"updatedBy"`  // User ID who made the change
	UpdatedData interface{} `json:"updatedData,omitempty"`
}

// TaskUpdatePayload for task-related updates
type TaskUpdatePayload struct {
	TaskID      string      `json:"taskId"`
	BoardID     string      `json:"boardId"`
	UpdateType  string      `json:"updateType"` // created, updated, deleted, assigned, etc.
	UpdatedBy   string      `json:"updatedBy"`  // User ID who made the change
	UpdatedData interface{} `json:"updatedData,omitempty"`
}

// UserTypingPayload for typing indicators
type UserTypingPayload struct {
	UserID   string `json:"userId"`
	TaskID   string `json:"taskId"`
	IsTyping bool   `json:"isTyping"`
}

// ErrorPayload for error messages
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ConnectionStatsPayload for connection statistics
type ConnectionStatsPayload struct {
	TotalConnections int      `json:"totalConnections"`
	ConnectedUsers   []string `json:"connectedUsers"`
}
