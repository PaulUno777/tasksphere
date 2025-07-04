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
	Timeout  time.Duration
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
		Timeout:  cfg.Timeout,
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
	return context.WithTimeout(context.Background(), c.Timeout)
}

// GetCollection returns a collection by name
func (c *Connection) GetCollection(name string) *mongo.Collection {
	return c.Database.Collection(name)
}
