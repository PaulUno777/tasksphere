package config

import (
	"log"
	"sync"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server      ServerConfig      `json:"server"`
	Database    DatabaseConfig    `json:"database"`
	Redis       RedisConfig       `json:"redis"`
	JWT         JWTConfig         `json:"jwt"`
	GoogleOAuth GoogleOAuthConfig `json:"googleOAuth"`
	Logging     LoggingConfig     `json:"logging"`
	RateLimit   RateLimitConfig   `json:"rate_limit"`
	WebSocket   WebSocketConfig   `json:"websocket"`
	I18n        I18nConfig        `json:"i18n"`
}

// ServerConfig contains HTTP server configuration
type ServerConfig struct {
	Port         string        `validate:"required"`
	Environment  string        `validate:"required,oneof=development staging production"`
	CORSOrigins  []string      
	ReadTimeout  time.Duration `validate:"required"`
	WriteTimeout time.Duration `validate:"required"`
	IdleTimeout  time.Duration `validate:"required"`
}

// DatabaseConfig contains MongoDB configuration
type DatabaseConfig struct {
	URI      string        `validate:"required"`
	Database string        `validate:"required"`
	Timeout  time.Duration `validate:"required"`
}

// RedisConfig contains Redis cache configuration
type RedisConfig struct {
	Host     string `validate:"required"`
	Port     string `validate:"required"`
	Password string
	DB       int           `validate:"min=0"`
	TTL      time.Duration `validate:"required"`
}

// JWTConfig contains JWT token configuration
type JWTConfig struct {
	Secret        string `validate:"required,min=32"`
	RefreshSecret string `validate:"required,min=32"`
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
}

// JWTConfig contains JWT token configuration
type GoogleOAuthConfig struct {
	ClientID     string `validate:"required"`
	ClientSecret string `validate:"required"`
	RedirectURL  string `validate:"required"`
}

// LoggingConfig contains logging configuration
type LoggingConfig struct {
	Level      string `validate:"required,oneof=debug info warn error"`
	Format     string `validate:"required,oneof=json console"`
	OutputDir  string
	MaxSize    int `validate:"min=1"`
	MaxBackups int `validate:"min=1"`
	MaxAge     int `validate:"min=1"`
	Compress   bool
}

// RateLimitConfig contains rate limiting configuration
type RateLimitConfig struct {
	General int `validate:"min=1"`
	Auth    int `validate:"min=1"`
	Comment int `validate:"min=1"`
	Window  time.Duration
}

// WebSocketConfig contains WebSocket configuration
type WebSocketConfig struct {
	ReadBufferSize  int `validate:"min=512"`
	WriteBufferSize int `validate:"min=512"`
	MaxConnections  int `validate:"min=1"`
}

type I18nConfig struct {
	DefaultLanguage string   `validate:"required"`
	SupportedLangs  []string `validate:"required,min=1"`
	BundlePath      string   `validate:"required"`
}

var (
	config *Config
	once   sync.Once
)

func Load() *Config {
	once.Do(func() {
		_ = godotenv.Load()

		tmp := &Config{
			Server: ServerConfig{
				Port:         getEnv("PORT", "3000"),
				Environment:  getEnv("APP_ENV", "development"),
				CORSOrigins:  getEnvAsStringSlice("CORS_ORIGINS", []string{"http://localhost:4200"}),
				ReadTimeout:  getEnvAsDuration("READ_TIMEOUT", 30*time.Second),
				WriteTimeout: getEnvAsDuration("WRITE_TIMEOUT", 30*time.Second),
				IdleTimeout:  getEnvAsDuration("IDLE_TIMEOUT", 120*time.Second),
			},
			Database: DatabaseConfig{
				URI:      getEnv("MONGO_URI", "mongodb://localhost:27017"),
				Database: getEnv("MONGO_DATABASE", "tasksphere"),
				Timeout:  getEnvAsDuration("MONGO_TIMEOUT", 10*time.Second),
			},
			Redis: RedisConfig{
				Host:     getEnv("REDIS_HOST", "localhost"),
				Port:     getEnv("REDIS_PORT", "6379"),
				Password: getEnv("REDIS_PASSWORD", ""),
				DB:       getEnvAsInt("REDIS_DB", 0),
				TTL:      getEnvAsDuration("CACHE_TTL", 5*time.Minute),
			},
			JWT: JWTConfig{
				Secret:        getEnv("JWT_SECRET", ""),
				RefreshSecret: getEnv("JWT_REFRESH_SECRET", ""),
				AccessExpiry:  time.Duration(getEnvAsInt("ACCESS_EXPIRY_MIN", 15)) * time.Minute,
				RefreshExpiry: time.Duration(getEnvAsInt("REFRESH_EXPIRY_HOUR", 24)) * time.Hour,
			},
			GoogleOAuth: GoogleOAuthConfig{
				ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
				ClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),
			},
			Logging: LoggingConfig{
				Level:      getEnv("LOG_LEVEL", "info"),
				Format:     getEnv("LOG_FORMAT", "json"),
				OutputDir:  getEnv("OUTPUT_DIR", "logs"),
				MaxSize:    getEnvAsInt("LOG_MAX_SIZE", 10),
				MaxBackups: getEnvAsInt("LOG_MAX_BACKUPS", 3),
				MaxAge:     getEnvAsInt("LOG_MAX_AGE", 28),
				Compress:   getEnvAsBool("LOG_COMPRESS", true),
			},
			RateLimit: RateLimitConfig{
				General: getEnvAsInt("RATE_LIMIT_GENERAL", 100),
				Auth:    getEnvAsInt("RATE_LIMIT_AUTH", 10),
				Comment: getEnvAsInt("RATE_LIMIT_COMMENT", 30),
				Window:  getEnvAsDuration("RATE_LIMIT_WINDOW", 5*time.Minute),
			},
			WebSocket: WebSocketConfig{
				ReadBufferSize:  getEnvAsInt("WS_READ_BUFFER_SIZE", 1024),
				WriteBufferSize: getEnvAsInt("WS_WRITE_BUFFER_SIZE", 1024),
				MaxConnections:  getEnvAsInt("WS_MAX_CONNECTIONS", 1000),
			},
			I18n: I18nConfig{
				DefaultLanguage: getEnv("DEFAULT_LANGUAGE", "en"),
				SupportedLangs:  getEnvAsStringSlice("SUPPORTED_LANGUAGES", []string{"en", "fr"}),
				BundlePath:      getEnv("BUNDLE_PATH", "locales"),
			},
		}

		// Validate using struct tags
		if err := tmp.Validate(); err != nil {
			log.Fatalf("Invalid config: %v", err)
		}
		config = tmp
	})
	return config
}

// Get returns the global configuration instance
func Get() *Config {
	if config == nil {
		return Load()
	}
	return config
}

// IsDevelopment returns true if the application is running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsProduction returns true if the application is running in production mode
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}
