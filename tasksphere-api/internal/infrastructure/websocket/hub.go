package websocket

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/v2/bson"
)

var (
	ErrClientNotFound   = errors.New("client not found")
	ErrUserNotConnected = errors.New("user not connected")
	ErrBroadcastFailed  = errors.New("broadcast failed")
	ErrInvalidBoardID   = errors.New("invalid board ID")
)

// Hub manages all WebSocket connections and handles smart message routing
// It maintains multiple indexes for efficient message delivery based on:
// - User connections (supporting multiple devices per user)
// - Board memberships (for board-specific broadcasts)
// - Client subscriptions (for granular control)
type Hub struct {
	// Core connection management
	clients    map[*Client]bool // All connected clients
	register   chan *Client     // Channel for client registration
	unregister chan *Client     // Channel for client unregistration

	// User-based indexes for multi-device support
	// Each user can have multiple clients (different devices/browsers)
	userClients map[bson.ObjectID][]*Client // UserID -> List of clients

	// Board-based indexes for efficient routing
	// Maps board IDs to users who are members of that board
	boardMembers map[bson.ObjectID][]bson.ObjectID // BoardID -> List of UserIDs

	// Client lookup for fast access
	clientByID map[string]*Client // ClientID -> Client

	// Broadcast channels
	broadcast      chan BroadcastMessage      // General broadcast to all clients
	userBroadcast  chan UserBroadcastMessage  // Broadcast to specific user(s)
	boardBroadcast chan BoardBroadcastMessage // Broadcast to board members

	// Synchronization
	mutex sync.RWMutex

	// Lifecycle management
	shutdown chan struct{}
	done     chan struct{}

	// Configuration
	maxConnections int
	logger         logrus.Logger

	// Dependencies for business logic
	// These should be interfaces to maintain separation between layers
	notificationService NotificationServiceInterface // For marking notifications as read
	boardService        BoardServiceInterface        // For checking board access
	taskService         TaskServiceInterface         // For getting task-board relationships
}

// Message types for different broadcast scenarios

// BroadcastMessage represents a message to broadcast to all connected clients
type BroadcastMessage struct {
	Type    WebSocketMessageType `json:"type"`
	Data    interface{}          `json:"data"`
	Exclude []string             `json:"exclude,omitempty"` // Client IDs to exclude
}

// UserBroadcastMessage represents a message to broadcast to specific user(s)
type UserBroadcastMessage struct {
	UserIDs       []bson.ObjectID      `json:"userIds"`
	Type          WebSocketMessageType `json:"type"`
	Data          interface{}          `json:"data"`
	ExcludeClient string               `json:"excludeClient,omitempty"` // Exclude specific client ID
}

// BoardBroadcastMessage represents a message to broadcast to board members
type BoardBroadcastMessage struct {
	BoardID             bson.ObjectID        `json:"boardId"`
	Type                WebSocketMessageType `json:"type"`
	Data                interface{}          `json:"data"`
	ExcludeUser         *bson.ObjectID       `json:"excludeUser,omitempty"`   // User ID to exclude
	ExcludeClient       string               `json:"excludeClient,omitempty"` // Client ID to exclude
	RequireSubscription bool                 `json:"requireSubscription"`     // Only send to subscribed clients
}

// Service interfaces for dependency injection (maintaining clean architecture)
type NotificationServiceInterface interface {
	MarkAsRead(ctx context.Context, userID, notificationID bson.ObjectID) error
	MarkAllAsRead(ctx context.Context, userID bson.ObjectID) error
}

type BoardServiceInterface interface {
	GetBoardMembers(ctx context.Context, boardID bson.ObjectID) ([]bson.ObjectID, error)
	HasBoardAccess(ctx context.Context, userID, boardID bson.ObjectID) (bool, error)
}

type TaskServiceInterface interface {
	GetBoardIDForTask(ctx context.Context, taskID bson.ObjectID) (bson.ObjectID, error)
}

func NewHub(maxConnections int) *Hub {
	return &Hub{
		clients:        make(map[*Client]bool),
		register:       make(chan *Client, 100),
		unregister:     make(chan *Client, 100),
		userClients:    make(map[bson.ObjectID][]*Client),
		boardMembers:   make(map[bson.ObjectID][]bson.ObjectID),
		clientByID:     make(map[string]*Client),
		broadcast:      make(chan BroadcastMessage, 256),
		userBroadcast:  make(chan UserBroadcastMessage, 256),
		boardBroadcast: make(chan BoardBroadcastMessage, 256),
		shutdown:       make(chan struct{}),
		done:           make(chan struct{}),
		maxConnections: maxConnections,
	}
}

func (h *Hub) SetServices(
	notificationService NotificationServiceInterface,
	boardService BoardServiceInterface,
	taskService TaskServiceInterface,
) {
	h.notificationService = notificationService
	h.boardService = boardService
	h.taskService = taskService
}

// Run starts the hub and begins processing messages
// This is the main event loop that handles all WebSocket operations
func (h *Hub) Run() {
	defer close(h.done)

	h.logger.Info("WebSocket Hub started")

	for {
		select {
		case client := <-h.register:
			h.handleClientRegistration(client)

		case client := <-h.unregister:
			h.handleClientUnregistration(client)

		case message := <-h.broadcast:
			h.handleBroadcastMessage(message)

		case message := <-h.userBroadcast:
			h.handleUserBroadcastMessage(message)

		case message := <-h.boardBroadcast:
			h.handleBoardBroadcastMessage(message)

		case <-h.shutdown:
			h.handleShutdown()
			return
		}
	}
}

// Client Registration and Management

// handleClientRegistration processes new client connections
// handleClientRegistration processes new client connections
func (h *Hub) handleClientRegistration(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Check connection limit
	if len(h.clients) >= h.maxConnections {
		h.logger.Printf("Connection limit reached (%d), rejecting client %s for user %s",
			h.maxConnections, client.ID, client.UserID.Hex())
		client.cleanup()
		return
	}

	// Register client
	h.clients[client] = true
	h.clientByID[client.ID] = client

	// Add to user clients list (supporting multiple devices per user)
	h.userClients[client.UserID] = append(h.userClients[client.UserID], client)

	// Load and cache board memberships for this user
	go h.refreshUserBoardMemberships(client.UserID)

	h.logger.Printf("Client registered: %s for user %s (Total connections: %d, User devices: %d)",
		client.ID, client.UserID.Hex(), len(h.clients), len(h.userClients[client.UserID]))
}

// handleClientUnregistration processes client disconnections
func (h *Hub) handleClientUnregistration(client *Client) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Check if client exists
	if _, exists := h.clients[client]; !exists {
		return
	}

	// Remove from main clients map
	delete(h.clients, client)
	delete(h.clientByID, client.ID)

	// Remove from user clients list
	userClients := h.userClients[client.UserID]
	for i, c := range userClients {
		if c.ID == client.ID {
			// Remove this client from the slice
			h.userClients[client.UserID] = append(userClients[:i], userClients[i+1:]...)
			break
		}
	}

	// Clean up empty user entry
	if len(h.userClients[client.UserID]) == 0 {
		delete(h.userClients, client.UserID)
		// Also clean up board memberships cache for this user
		h.cleanupUserBoardMemberships(client.UserID)
	}

	h.logger.Info("Client unregistered: %s for user %s (Total connections: %d)",
		client.ID, client.UserID.Hex(), len(h.clients))
}

func (h *Hub) handleBroadcastMessage(message BroadcastMessage) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	messageBytes, err := json.Marshal(WebSocketMessage{
		Type:      message.Type,
		Data:      message.Data,
		Timestamp: time.Now(),
	})
	if err != nil {
		h.logger.Error("Error marshaling broadcast message: %v", err)
		return
	}

	excludeMap := make(map[string]bool)
	for _, clientID := range message.Exclude {
		excludeMap[clientID] = true
	}

	sentCount := 0
	for client := range h.clients {
		// Skip excluded clients
		if excludeMap[client.ID] {
			continue
		}

		if h.sendToClient(client, messageBytes) {
			sentCount++
		}
	}

	h.logger.Info("Broadcast message sent to %d clients", sentCount)
}

// handleUserBroadcastMessage sends a message to specific users (all their devices)
func (h *Hub) handleUserBroadcastMessage(message UserBroadcastMessage) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	messageBytes, err := json.Marshal(WebSocketMessage{
		Type:      message.Type,
		Data:      message.Data,
		Timestamp: time.Now(),
	})
	if err != nil {
		h.logger.Error("Error marshaling user broadcast message: %v", err)
		return
	}

	sentCount := 0
	for _, userID := range message.UserIDs {
		clients := h.userClients[userID]
		for _, client := range clients {
			// Skip excluded client
			if client.ID == message.ExcludeClient {
				continue
			}

			if h.sendToClient(client, messageBytes) {
				sentCount++
			}
		}
	}

	h.logger.Info("User broadcast message sent to %d clients for %d users", sentCount, len(message.UserIDs))
}

func (h *Hub) handleBoardBroadcastMessage(message BoardBroadcastMessage) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	messageBytes, err := json.Marshal(WebSocketMessage{
		Type:      message.Type,
		Data:      message.Data,
		Timestamp: time.Now(),
	})
	if err != nil {
		h.logger.Error("Error marshaling board broadcast message: %v", err)
		return
	}

	// Get board members from cache
	memberUserIDs, exists := h.boardMembers[message.BoardID]
	if !exists {
		// If not in cache, refresh and try again
		go h.refreshBoardMemberships(message.BoardID)
		h.logger.Error("Board members not cached for board %s, refreshing", message.BoardID.Hex())
		return
	}

	sentCount := 0
	for _, userID := range memberUserIDs {
		// Skip excluded user
		if message.ExcludeUser != nil && userID == *message.ExcludeUser {
			continue
		}

		// Get all clients for this user
		clients := h.userClients[userID]
		for _, client := range clients {
			// Skip excluded client
			if client.ID == message.ExcludeClient {
				continue
			}

			// If subscription is required, check if client is subscribed to this board
			if message.RequireSubscription && !client.isSubscribedToBoard(message.BoardID) {
				continue
			}

			if h.sendToClient(client, messageBytes) {
				sentCount++
			}
		}
	}

	h.logger.Info("Board broadcast message sent to %d clients for board %s", sentCount, message.BoardID.Hex())
}

// Helper method to send message to a specific client with error handling
func (h *Hub) sendToClient(client *Client, messageBytes []byte) bool {
	select {
	case client.send <- messageBytes:
		return true
	default:
		// Client's send buffer is full, force disconnect
		h.logger.Info("Client %s send buffer full, disconnecting", client.ID)
		h.forceDisconnectClient(client)
		return false
	}
}

// forceDisconnectClient forcefully disconnects a problematic client
func (h *Hub) forceDisconnectClient(client *Client) {
	// Remove from maps (this should be called with mutex held)
	delete(h.clients, client)
	delete(h.clientByID, client.ID)

	// Remove from user clients
	userClients := h.userClients[client.UserID]
	for i, c := range userClients {
		if c.ID == client.ID {
			h.userClients[client.UserID] = append(userClients[:i], userClients[i+1:]...)
			break
		}
	}

	// Clean up empty user entry
	if len(h.userClients[client.UserID]) == 0 {
		delete(h.userClients, client.UserID)
	}

	// Close the client
	close(client.send)
}

// Public API Methods for Application Layer

// SendNotificationToUser sends a notification to a specific user (all their devices)
// This ensures delivery guarantee - if user is online, they get the notification immediately
// If offline, notification is stored in database and delivered when they reconnect
func (h *Hub) SendNotificationToUser(notification *entities.Notification) error {
	// Create notification payload
	payload := NotificationPayload{
		ID:        notification.ID.Hex(),
		Type:      notification.Type,
		Content:   notification.Content,
		Priority:  notification.Priority,
		IsRead:    notification.IsRead,
		CreatedAt: notification.CreatedAt,
	}

	if notification.BoardID != nil {
		boardIDStr := notification.BoardID.Hex()
		payload.BoardID = &boardIDStr
	}

	if notification.TaskID != nil {
		taskIDStr := notification.TaskID.Hex()
		payload.TaskID = &taskIDStr
	}

	// Send to user via WebSocket
	message := UserBroadcastMessage{
		UserIDs: []bson.ObjectID{notification.RecipientID},
		Type:    MessageTypeNotification,
		Data:    payload,
	}

	select {
	case h.userBroadcast <- message:
		// Mark as delivered if user is connected
		if h.IsUserConnected(notification.RecipientID) {
			notification.MarkAsDelivered()
		}
		return nil
	default:
		return ErrBroadcastFailed
	}
}

// SendBoardUpdate sends an update to all members of a board
// Only sends to clients that are subscribed to the board for efficiency
func (h *Hub) SendBoardUpdate(boardID bson.ObjectID, updateType string, updatedBy bson.ObjectID, data interface{}) error {
	payload := BoardUpdatePayload{
		BoardID:     boardID.Hex(),
		UpdateType:  updateType,
		UpdatedBy:   updatedBy.Hex(),
		UpdatedData: data,
	}

	message := BoardBroadcastMessage{
		BoardID:             boardID,
		Type:                MessageTypeBoardUpdate,
		Data:                payload,
		ExcludeUser:         &updatedBy, // Don't send to the user who made the change
		RequireSubscription: true,       // Only send to subscribed clients
	}

	select {
	case h.boardBroadcast <- message:
		return nil
	default:
		return ErrBroadcastFailed
	}
}

// SendTaskUpdate sends a task update to relevant board members
func (h *Hub) SendTaskUpdate(taskID, boardID bson.ObjectID, updateType string, updatedBy bson.ObjectID, data interface{}) error {
	payload := TaskUpdatePayload{
		TaskID:      taskID.Hex(),
		BoardID:     boardID.Hex(),
		UpdateType:  updateType,
		UpdatedBy:   updatedBy.Hex(),
		UpdatedData: data,
	}

	message := BoardBroadcastMessage{
		BoardID:             boardID,
		Type:                MessageTypeTaskUpdate,
		Data:                payload,
		ExcludeUser:         &updatedBy, // Don't send to the user who made the change
		RequireSubscription: false,      // Send to all board members
	}

	select {
	case h.boardBroadcast <- message:
		return nil
	default:
		return ErrBroadcastFailed
	}
}

// Connection Status and Statistics

// IsUserConnected checks if a user has any active connections
func (h *Hub) IsUserConnected(userID bson.ObjectID) bool {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	clients := h.userClients[userID]
	return len(clients) > 0
}

// GetUserConnectionCount returns the number of active connections for a user
func (h *Hub) GetUserConnectionCount(userID bson.ObjectID) int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	return len(h.userClients[userID])
}

// GetTotalConnectionCount returns the total number of active connections
func (h *Hub) GetTotalConnectionCount() int {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	return len(h.clients)
}

// GetConnectedUserIDs returns a list of all connected user IDs
func (h *Hub) GetConnectedUserIDs() []bson.ObjectID {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	userIDs := make([]bson.ObjectID, 0, len(h.userClients))
	for userID := range h.userClients {
		userIDs = append(userIDs, userID)
	}

	return userIDs
}

// Business Logic Integration (these methods integrate with use cases)

// markNotificationAsRead integrates with notification service to mark notification as read
func (h *Hub) markNotificationAsRead(userID, notificationID bson.ObjectID) error {
	if h.notificationService == nil {
		return errors.New("notification service not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return h.notificationService.MarkAsRead(ctx, userID, notificationID)
}

// markAllNotificationsAsRead integrates with notification service
func (h *Hub) markAllNotificationsAsRead(userID bson.ObjectID) error {
	if h.notificationService == nil {
		return errors.New("notification service not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return h.notificationService.MarkAllAsRead(ctx, userID)
}

// userHasBoardAccess checks if user has access to a board
func (h *Hub) userHasBoardAccess(userID, boardID bson.ObjectID) bool {
	if h.boardService == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	hasAccess, err := h.boardService.HasBoardAccess(ctx, userID, boardID)
	if err != nil {
		h.logger.Error("Error checking board access: %v", err)
		return false
	}

	return hasAccess
}

// getBoardIDForTask gets the board ID that contains a specific task
func (h *Hub) getBoardIDForTask(taskID bson.ObjectID) bson.ObjectID {
	if h.taskService == nil {
		return bson.NilObjectID
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	boardID, err := h.taskService.GetBoardIDForTask(ctx, taskID)
	if err != nil {
		h.logger.Error("Error getting board for task: %v", err)
		return bson.NilObjectID
	}

	return boardID
}

// Board Membership Caching for Performance

// refreshUserBoardMemberships refreshes the cached board memberships for a user
func (h *Hub) refreshUserBoardMemberships(userID bson.ObjectID) {
	if h.boardService == nil {
		return
	}

	// This would typically call a use case to get user's boards
	// For now, we'll just log that it should be implemented
	h.logger.Info("TODO: Refresh board memberships for user %s", userID.Hex())
}

// refreshBoardMemberships refreshes the cached members for a board
func (h *Hub) refreshBoardMemberships(boardID bson.ObjectID) {
	if h.boardService == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	members, err := h.boardService.GetBoardMembers(ctx, boardID)
	if err != nil {
		h.logger.Error("Error refreshing board members for board %s: %v", boardID.Hex(), err)
		return
	}

	h.mutex.Lock()
	h.boardMembers[boardID] = members
	h.mutex.Unlock()

	h.logger.Info("Refreshed %d members for board %s", len(members), boardID.Hex())
}

// cleanupUserBoardMemberships cleans up board membership cache when user disconnects
func (h *Hub) cleanupUserBoardMemberships(userID bson.ObjectID) {
	// Remove user from all board membership caches
	h.mutex.Lock()
	for boardID, members := range h.boardMembers {
		for i, memberID := range members {
			if memberID == userID {
				// Remove user from this board's member list
				h.boardMembers[boardID] = append(members[:i], members[i+1:]...)
				break
			}
		}

		// If board has no more members, remove it from cache
		if len(h.boardMembers[boardID]) == 0 {
			delete(h.boardMembers, boardID)
		}
	}
	h.mutex.Unlock()
}

// notifyUserClients sends a message to all clients of a specific user
func (h *Hub) notifyUserClients(userID bson.ObjectID, msgType WebSocketMessageType, data interface{}) {
	message := UserBroadcastMessage{
		UserIDs: []bson.ObjectID{userID},
		Type:    msgType,
		Data:    data,
	}

	select {
	case h.userBroadcast <- message:
	default:
		h.logger.Info("Failed to notify user clients for user %s", userID.Hex())
	}
}

// notifyBoardMembers sends a message to all members of a board
func (h *Hub) notifyBoardMembers(boardID, excludeUser bson.ObjectID, msgType WebSocketMessageType, data interface{}) {
	message := BoardBroadcastMessage{
		BoardID:     boardID,
		Type:        msgType,
		Data:        data,
		ExcludeUser: &excludeUser,
	}

	select {
	case h.boardBroadcast <- message:
	default:
		h.logger.Error("Failed to notify board members for board %s", boardID.Hex())
	}
}

// Lifecycle Management

// handleShutdown gracefully shuts down the hub
func (h *Hub) handleShutdown() {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	h.logger.Info("WebSocket Hub shutting down...")

	// Close all client connections
	for client := range h.clients {
		close(client.send)
	}

	h.logger.Printf("WebSocket Hub shut down. Closed %d client connections", len(h.clients))
}

// Shutdown initiates graceful shutdown
func (h *Hub) Shutdown() {
	close(h.shutdown)

	// Wait for shutdown to complete or timeout
	select {
	case <-h.done:
		h.logger.Info("WebSocket Hub shutdown complete")
	case <-time.After(30 * time.Second):
		h.logger.Info("WebSocket Hub shutdown timed out")
	}
}
