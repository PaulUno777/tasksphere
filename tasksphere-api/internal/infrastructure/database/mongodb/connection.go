package mongodb

import (
	"context"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

type Connection struct {
	Client   *mongo.Client
	Database *mongo.Database
	timeout  time.Duration
}

func NewConnection(cfg *config.DatabaseConfig) (*Connection, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Set client options
	clientOptions := options.Client().
		ApplyURI(cfg.URI).
		SetMaxPoolSize(100).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(30 * time.Second).
		SetConnectTimeout(cfg.Timeout).
		SetServerSelectionTimeout(5 * time.Second)

	// Connect to MongoDB
	client, err := mongo.Connect(clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping the database
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database := client.Database(cfg.Database)

	mongoDB := &Connection{
		Client:   client,
		Database: database,
		timeout:  cfg.Timeout,
	}

	// Create indexes
	if err := mongoDB.createIndexes(ctx); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	return mongoDB, nil
}

func (c *Connection) Disconnect() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return c.Client.Disconnect(ctx)
}

// WithTimeout creates a context with the configured timeout
func (c *Connection) WithTimeout() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), c.timeout)
}

// GetCollection returns a collection by name
func (c *Connection) GetCollection(name string) *mongo.Collection {
	return c.Database.Collection(name)
}

func (c *Connection) createIndexes(ctx context.Context) error {
	// User indexes
	userCollection := c.GetCollection("users")
	userIndexes := []mongo.IndexModel{
		{
			Keys:    map[string]int{"email": 1},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: map[string]int{"createdAt": 1},
		},
		{
			Keys: map[string]int{"isActive": 1},
		},
	}
	if _, err := userCollection.Indexes().CreateMany(ctx, userIndexes); err != nil {
		return fmt.Errorf("failed to create user indexes: %w", err)
	}

	// // Board indexes
	// boardCollection := c.GetCollection("boards")
	// boardIndexes := []mongo.IndexModel{
	// 	{
	// 		Keys: map[string]int{"ownerId": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"createdAt": -1},
	// 	},
	// 	{
	// 		Keys: map[string]string{"title": "text", "description": "text"},
	// 	},
	// }
	// if _, err := boardCollection.Indexes().CreateMany(ctx, boardIndexes); err != nil {
	// 	return fmt.Errorf("failed to create board indexes: %w", err)
	// }

	// // BoardMember indexes
	// memberCollection := c.GetCollection("board_members")
	// memberIndexes := []mongo.IndexModel{
	// 	{
	// 		Keys:    map[string]int{"userId": 1, "boardId": 1},
	// 		Options: options.Index().SetUnique(true),
	// 	},
	// 	{
	// 		Keys: map[string]int{"boardId": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"userId": 1},
	// 	},
	// }
	// if _, err := memberCollection.Indexes().CreateMany(ctx, memberIndexes); err != nil {
	// 	return fmt.Errorf("failed to create board member indexes: %w", err)
	// }

	// // Task indexes
	// taskCollection := c.GetCollection("tasks")
	// taskIndexes := []mongo.IndexModel{
	// 	{
	// 		Keys: map[string]int{"boardId": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"assignedTo": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"status": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"dueDate": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"createdAt": -1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"boardId": 1, "status": 1},
	// 	},
	// }
	// if _, err := taskCollection.Indexes().CreateMany(ctx, taskIndexes); err != nil {
	// 	return fmt.Errorf("failed to create task indexes: %w", err)
	// }

	// // Comment indexes
	// commentCollection := c.GetCollection("comments")
	// commentIndexes := []mongo.IndexModel{
	// 	{
	// 		Keys: map[string]int{"taskId": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"authorId": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"createdAt": -1},
	// 	},
	// }
	// if _, err := commentCollection.Indexes().CreateMany(ctx, commentIndexes); err != nil {
	// 	return fmt.Errorf("failed to create comment indexes: %w", err)
	// }

	// // Category indexes
	// categoryCollection := c.GetCollection("categories")
	// categoryIndexes := []mongo.IndexModel{
	// 	{
	// 		Keys: map[string]int{"boardId": 1},
	// 	},
	// 	{
	// 		Keys:    map[string]int{"name": 1, "boardId": 1},
	// 		Options: options.Index().SetUnique(true),
	// 	},
	// }
	// if _, err := categoryCollection.Indexes().CreateMany(ctx, categoryIndexes); err != nil {
	// 	return fmt.Errorf("failed to create category indexes: %w", err)
	// }

	// // Notification indexes
	// notificationCollection := c.GetCollection("notifications")
	// notificationIndexes := []mongo.IndexModel{
	// 	{
	// 		Keys: map[string]int{"recipientId": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"isRead": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"createdAt": -1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"recipientId": 1, "isRead": 1},
	// 	},
	// 	{
	// 		Keys: map[string]int{"isDelivered": 1},
	// 	},
	// 	// TTL index for automatic cleanup of old notifications (90 days)
	// 	{
	// 		Keys:    map[string]int{"createdAt": 1},
	// 		Options: options.Index().SetExpireAfterSeconds(90 * 24 * 60 * 60),
	// 	},
	// }
	// if _, err := notificationCollection.Indexes().CreateMany(ctx, notificationIndexes); err != nil {
	// 	return fmt.Errorf("failed to create notification indexes: %w", err)
	// }

	return nil
}
