package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"github.com/redis/go-redis/v9"
)

// Connection holds the Connection client
type Connection struct {
	client *redis.Client
	TTL    time.Duration
}

// NewRedis creates a new Redis client
func NewRedis(config *config.RedisConfig, logger *logger.Logger, db int) (*Connection, error) {

	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", config.Host, config.Port),
		Password: config.Password,
		DB:       config.DB,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &Connection{
		client: client,
		TTL:    config.TTL,
	}, nil
}

// Set sets a key-value pair with expiration
func (r *Connection) Set(ctx context.Context, key string, value interface{}) error {
	return r.SetWithTTL(ctx, key, value, time.Duration(r.TTL)*time.Second)
}

func (c *Connection) SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return c.client.Set(ctx, key, data, ttl).Err()
}

// Get gets a value by key
func (r *Connection) Get(ctx context.Context, key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

func (r *Connection) GetTTL(ctx context.Context, key string) (time.Duration, error) {
	return r.client.TTL(ctx, key).Result()
}

// Exists checks if a key exists
func (r *Connection) Exists(ctx context.Context, key string) (bool, error) {
	result, err := r.client.Exists(ctx, key).Result()
	return result > 0, err
}

// Delete deletes a key
func (r *Connection) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

// Close closes the Redis connection
func (r *Connection) Close() error {
	return r.client.Close()
}
