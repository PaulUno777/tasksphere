package services

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
)

// WebSocketMessage represents a message that can be sent through WebSocket
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	UserID    string      `json:"userId,omitempty"`
	BoardID   string      `json:"boardId,omitempty"`
	TaskID    string      `json:"taskId,omitempty"`
	Timestamp int64       `json:"timestamp"`
	Language  string      `json:"language,omitempty"`
}

// ConnectionInfo represents information about a WebSocket connection
type ConnectionInfo struct {
	UserID       bson.ObjectID `json:"userId"`
	ConnectionID string        `json:"connectionId"`
	DeviceInfo   string        `json:"deviceInfo,omitempty"`
	IPAddress    string        `json:"ipAddress"`
	UserAgent    string        `json:"userAgent,omitempty"`
	Language     string        `json:"language"`
	ConnectedAt  int64         `json:"connectedAt"`
}

// WebSocketService defines the business logic for real-time message handling
// This service manages TRANSIENT messages - no persistence, just real-time delivery
type WebSocketService interface {
	// Connection management
	RegisterConnection(ctx context.Context, conn ConnectionInfo) error
	UnregisterConnection(ctx context.Context, connectionID string) error

	// Message delivery - the core responsibility of this service
	SendToUser(ctx context.Context, userID bson.ObjectID, message WebSocketMessage) error
	SendToBoard(ctx context.Context, boardID bson.ObjectID, message WebSocketMessage, excludeUserID *bson.ObjectID) error
	SendToConnection(ctx context.Context, connectionID string, message WebSocketMessage) error
	BroadcastToAll(ctx context.Context, message WebSocketMessage) error

	// Connection queries
	GetUserConnections(ctx context.Context, userID bson.ObjectID) ([]ConnectionInfo, error)
	GetBoardConnections(ctx context.Context, boardID bson.ObjectID) ([]ConnectionInfo, error)
	IsUserConnected(ctx context.Context, userID bson.ObjectID) (bool, error)
	GetConnectionCount(ctx context.Context) (int, error)

	// Delivery tracking for reliable messaging
	TrackMessageDelivery(ctx context.Context, connectionID string, messageID string, delivered bool) error
	GetFailedDeliveries(ctx context.Context, userID bson.ObjectID) ([]string, error)
}
