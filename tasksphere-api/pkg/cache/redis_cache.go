package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()
var Client *redis.Client

func InitRedisCache(addr string) {
	Client = redis.NewClient(&redis.Options{
		Addr: addr,
		DB:   0,
	})
}

func Set(key string, value string, ttl time.Duration) error {
	return Client.Set(ctx, key, value, ttl).Err()
}

func Get(key string) (string, error) {
	return Client.Get(ctx, key).Result()
}
