package websocket

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// Connection configuration constants
const (
	writeWait      = 10 * time.Second    // Time allowed to write a message to the peer
	pongWait       = 60 * time.Second    // Time allowed to read the next pong message from the peer
	pingPeriod     = (pongWait * 9) / 10 // Send pings to peer with this period
	maxMessageSize = 512                 // Maximum message size allowed from peer
)

// Client represents a single WebSocket connection from a user device
type Client struct {
	// Connection identifiers
	ID       string        // Unique client ID (UUID)
	UserID   bson.ObjectID // User who owns this connection
	Language string        // User's preferred language (from token)

	// Connection details
	conn *websocket.Conn // WebSocket connection
	hub  *Hub            // Reference to the hub
	send chan []byte     // Buffered channel for outbound messages

	// Subscriptions - boards this client is subscribed to for real-time updates
	boardSubscriptions map[bson.ObjectID]bool
	subscriptionMutex  sync.RWMutex

	// Connection lifecycle
	ctx      context.Context
	cancel   context.CancelFunc
	lastPing time.Time
	lastPong time.Time
	isActive bool

	// Message tracking for delivery guarantees
	pendingMessages map[string]*WebSocketMessage // messageID -> message
	pendingMutex    sync.RWMutex
}

func NewClient(conn *websocket.Conn, userID bson.ObjectID, language string, hub *Hub) *Client {
	ctx, cancel := context.WithCancel(context.Background())

	client := &Client{
		ID:                 uuid.New().String(),
		UserID:             userID,
		Language:           language,
		conn:               conn,
		hub:                hub,
		send:               make(chan []byte, 256),
		boardSubscriptions: make(map[bson.ObjectID]bool),
		ctx:                ctx,
		cancel:             cancel,
		lastPing:           time.Now(),
		lastPong:           time.Now(),
		isActive:           true,
		pendingMessages:    make(map[string]*WebSocketMessage),
	}

	return client
}

// Start begins the client's read and write loops
func (c *Client) Start() {
	go c.writePump()
	go c.readPump()

	// Send initial connection message
	c.sendConnectionConfirmation()
}

// readPump handles incoming messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		c.cleanup()
	}()

	// Configure connection limits
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.lastPong = time.Now()
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		select {
		case <-c.ctx.Done():
			return
		default:
			_, messageBytes, err := c.conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("WebSocket error for client %s (user %s): %v", c.ID, c.UserID.Hex(), err)
				}
				return
			}

			// Process incoming message
			if err := c.handleIncomingMessage(messageBytes); err != nil {
				log.Printf("Error handling message from client %s: %v", c.ID, err)
				c.sendError("INVALID_MESSAGE", "Failed to process message")
			}
		}
	}
}

// writePump handles outgoing messages to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.cleanup()
	}()

	for {
		select {
		case <-c.ctx.Done():
			return

		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Error writing message to client %s: %v", c.ID, err)
				return
			}

		case <-ticker.C:
			c.lastPing = time.Now()
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Error sending ping to client %s: %v", c.ID, err)
				return
			}
		}
	}
}

// handleIncomingMessage processes messages received from the client
func (c *Client) handleIncomingMessage(messageBytes []byte) error {
	var message WebSocketMessage
	if err := json.Unmarshal(messageBytes, &message); err != nil {
		return err
	}

	// Route message based on type
	switch message.Type {
	case MessageTypePing:
		return c.handlePing()
	case MessageTypeSubscribeBoard:
		return c.handleSubscribeBoard(message.Data)
	case MessageTypeUnsubscribeBoard:
		return c.handleUnsubscribeBoard(message.Data)
	case MessageTypeMarkRead:
		return c.handleMarkRead(message.Data)
	case MessageTypeMarkAllRead:
		return c.handleMarkAllRead()
	case MessageTypeTyping:
		return c.handleTyping(message.Data)
	default:
		return c.sendError("UNKNOWN_MESSAGE_TYPE", "Unknown message type: "+string(message.Type))
	}
}

// handlePing responds to ping messages
func (c *Client) handlePing() error {
	return c.sendMessage(MessageTypePong, nil)
}

// handleSubscribeBoard subscribes client to board updates
func (c *Client) handleSubscribeBoard(data interface{}) error {
	var payload SubscribeBoardPayload
	if err := c.parsePayload(data, &payload); err != nil {
		return err
	}

	boardID, err := bson.ObjectIDFromHex(payload.BoardID)
	if err != nil {
		return c.sendError("INVALID_BOARD_ID", "Invalid board ID format")
	}

	// Check if user has access to this board (this should call a use case)
	if !c.hub.userHasBoardAccess(c.UserID, boardID) {
		return c.sendError("ACCESS_DENIED", "You don't have access to this board")
	}

	// Subscribe to board
	c.subscriptionMutex.Lock()
	c.boardSubscriptions[boardID] = true
	c.subscriptionMutex.Unlock()

	log.Printf("Client %s subscribed to board %s", c.ID, boardID.Hex())
	return c.sendMessage(MessageTypeBoardUpdate, map[string]interface{}{
		"boardId":    boardID.Hex(),
		"subscribed": true,
	})
}

// handleUnsubscribeBoard unsubscribes client from board updates
func (c *Client) handleUnsubscribeBoard(data interface{}) error {
	var payload SubscribeBoardPayload
	if err := c.parsePayload(data, &payload); err != nil {
		return err
	}

	boardID, err := bson.ObjectIDFromHex(payload.BoardID)
	if err != nil {
		return c.sendError("INVALID_BOARD_ID", "Invalid board ID format")
	}

	// Unsubscribe from board
	c.subscriptionMutex.Lock()
	delete(c.boardSubscriptions, boardID)
	c.subscriptionMutex.Unlock()

	log.Printf("Client %s unsubscribed from board %s", c.ID, boardID.Hex())
	return c.sendMessage(MessageTypeBoardUpdate, map[string]interface{}{
		"boardId":    boardID.Hex(),
		"subscribed": false,
	})
}

// handleMarkRead marks a notification as read
func (c *Client) handleMarkRead(data interface{}) error {
	var payload MarkReadPayload
	if err := c.parsePayload(data, &payload); err != nil {
		return err
	}

	notificationID, err := bson.ObjectIDFromHex(payload.NotificationID)
	if err != nil {
		return c.sendError("INVALID_NOTIFICATION_ID", "Invalid notification ID format")
	}

	// Mark notification as read (this should call a use case)
	if err := c.hub.markNotificationAsRead(c.UserID, notificationID); err != nil {
		return c.sendError("MARK_READ_FAILED", "Failed to mark notification as read")
	}

	// Notify other clients of this user that notification was read
	c.hub.notifyUserClients(c.UserID, MessageTypeNotificationRead, map[string]interface{}{
		"notificationId": notificationID.Hex(),
		"readBy":         c.ID,
	})

	return nil
}

// handleMarkAllRead marks all notifications as read for the user
func (c *Client) handleMarkAllRead() error {
	// Mark all notifications as read (this should call a use case)
	if err := c.hub.markAllNotificationsAsRead(c.UserID); err != nil {
		return c.sendError("MARK_ALL_READ_FAILED", "Failed to mark all notifications as read")
	}

	// Notify other clients of this user
	c.hub.notifyUserClients(c.UserID, MessageTypeNotificationRead, map[string]interface{}{
		"allRead": true,
		"readBy":  c.ID,
	})

	return nil
}

// handleTyping handles typing indicators
func (c *Client) handleTyping(data interface{}) error {
	var payload TypingPayload
	if err := c.parsePayload(data, &payload); err != nil {
		return err
	}

	taskID, err := bson.ObjectIDFromHex(payload.TaskID)
	if err != nil {
		return c.sendError("INVALID_TASK_ID", "Invalid task ID format")
	}

	// Get board ID for this task and notify other board members
	boardID := c.hub.getBoardIDForTask(taskID)
	if boardID != bson.NilObjectID {
		c.hub.notifyBoardMembers(boardID, c.UserID, MessageTypeUserTyping, UserTypingPayload{
			UserID:   c.UserID.Hex(),
			TaskID:   taskID.Hex(),
			IsTyping: true,
		})
	}

	return nil
}

// Utility methods

// sendMessage sends a message to the client
func (c *Client) sendMessage(msgType WebSocketMessageType, data interface{}) error {
	message := WebSocketMessage{
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now(),
		MessageID: uuid.New().String(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	select {
	case c.send <- messageBytes:
		return nil
	default:
		return c.sendError("SEND_BUFFER_FULL", "Client send buffer is full")
	}
}

// sendError sends an error message to the client
func (c *Client) sendError(code, message string) error {
	return c.sendMessage(MessageTypeError, ErrorPayload{
		Code:    code,
		Message: message,
	})
}

// sendConnectionConfirmation sends initial connection confirmation
func (c *Client) sendConnectionConfirmation() {
	c.sendMessage(MessageTypeConnected, map[string]interface{}{
		"clientId":  c.ID,
		"userId":    c.UserID.Hex(),
		"language":  c.Language,
		"timestamp": time.Now(),
	})
}

// parsePayload parses message payload into target structure
func (c *Client) parsePayload(data interface{}, target interface{}) error {
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(dataBytes, target)
}

// isSubscribedToBoard checks if client is subscribed to a board
func (c *Client) isSubscribedToBoard(boardID bson.ObjectID) bool {
	c.subscriptionMutex.RLock()
	defer c.subscriptionMutex.RUnlock()
	return c.boardSubscriptions[boardID]
}

// getSubscribedBoards returns list of boards this client is subscribed to
func (c *Client) getSubscribedBoards() []bson.ObjectID {
	c.subscriptionMutex.RLock()
	defer c.subscriptionMutex.RUnlock()

	boards := make([]bson.ObjectID, 0, len(c.boardSubscriptions))
	for boardID := range c.boardSubscriptions {
		boards = append(boards, boardID)
	}
	return boards
}

// cleanup handles client disconnection cleanup
func (c *Client) cleanup() {
	c.isActive = false
	c.cancel()

	// Unregister from hub
	c.hub.unregister <- c

	// Close connection
	c.conn.Close()

	log.Printf("Client %s (user %s) disconnected", c.ID, c.UserID.Hex())
}
