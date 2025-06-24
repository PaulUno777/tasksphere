package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
)

type Config struct {
	Port              int    `env:"PORT" validate:"required" envDefault:"3000"`
	AppEnv            string `env:"APP_ENV" validate:"oneof=development production" envDefault:"development"`
	CORSOrigins       []string
	JWTSecret         string `env:"JWT_SECRET" validate:"required"`
	JWTRefreshSecret  string `env:"JWT_REFRESH_SECRET" validate:"required"`
	MongoURI          string `env:"MONGO_URI" validate:"required,url"`
	MongoDatabase     string `validate:"required"`
	RedisHost         string `validate:"required,hostname|ip"`
	RedisPort         int    `validate:"min=1"`
	RedisPassword     string // Optional
	CacheTTLSeconds   int    `validate:"required,min=10"`
	AccessExpiryMin   int    `validate:"required,min=5"` // Access Token
	RefreshExpiryHour int    `validate:"required,min=1"` // Refresh Token
}

var (
	cfg  *Config
	once sync.Once
)

func LoadConfig() *Config {
	once.Do(func() {
		// Load from .env if present (dev)
		_ = godotenv.Load()

		validate := validator.New()
		port := getEnvAsInt("PORT", 3000)
		AppEnv := getEnv("APP_ENV", "development")
		corsOrigins := getEnvAsSlice("CORS_ORIGINS", []string{"http://localhost:4200"})

		JWTSecret := getEnv("JWT_SECRET", "")
		JWTRefreshSecret := getEnv("JWT_REFRESH_SECRET", "")
		AccessExpiryMin := getEnvAsInt("ACCESS_EXPIRY_MIN", 60)
		RefreshExpiryHour := getEnvAsInt("REFRESH_EXPIRY_HOUR", 24)

		mongoURI := getEnv("MONGO_URI", "")
		MongoDatabase := getEnv("MONGO_DATABASE", "")

		RedisHost := getEnv("REDIS_HOST", "")
		RedisPort := getEnvAsInt("REDIS_HOST", 4000)
		RedisPassword := getEnv("REDIS_HOST", "")
		CacheTTLSeconds := getEnvAsInt("REDIS_HOST", 300)

		tmp := &Config{
			Port:              port,
			AppEnv:            AppEnv,
			CORSOrigins:       corsOrigins,
			JWTSecret:         JWTSecret,
			JWTRefreshSecret:  JWTRefreshSecret,
			MongoURI:          mongoURI,
			MongoDatabase:     MongoDatabase,
			RedisHost:         RedisHost,
			RedisPort:         RedisPort,
			RedisPassword:     RedisPassword,
			CacheTTLSeconds:   CacheTTLSeconds,
			AccessExpiryMin:   AccessExpiryMin,
			RefreshExpiryHour: RefreshExpiryHour,
		}

		// Validate using struct tags
		if err := validate.Struct(tmp); err != nil {
			log.Fatalf("Invalid config: %v", err)
		}
		cfg = tmp
	})
	return cfg
}

// --- Utilities ---

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	valStr := getEnv(key, "")
	if valStr == "" {
		return fallback
	}
	var val int
	_, err := fmt.Sscanf(valStr, "%d", &val)
	if err != nil {
		return fallback
	}
	return val
}

func getEnvAsSlice(key string, fallback []string) []string {
	valStr := getEnv(key, "")
	if valStr == "" {
		return fallback
	}
	parts := strings.Split(valStr, ",")
	for i, v := range parts {
		parts[i] = strings.TrimSpace(v)
	}
	return parts
}
