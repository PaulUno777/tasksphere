package logger

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/sirupsen/logrus"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Logger wraps logrus with additional functionality
type Logger struct {
	*logrus.Logger
}

var (
	instance *Logger
	once     sync.Once
)

// New creates a new logger instance with file rotation
func New() *Logger {
	once.Do(func() {
		cfg := config.Get()
		logger := logrus.New()
		// Set log level
		level, err := logrus.ParseLevel(cfg.Logging.Level)
		if err != nil {
			level = logrus.InfoLevel
		}
		logger.SetLevel(level)

		if cfg.Logging.Format == "json" {
			logger.SetFormatter(&logrus.JSONFormatter{
				TimestampFormat: "2006-01-02 15:04:05",
				FieldMap: logrus.FieldMap{
					logrus.FieldKeyTime:  "timestamp",
					logrus.FieldKeyLevel: "level",
					logrus.FieldKeyMsg:   "message",
				},
			})
		} else {
			logger.SetFormatter(&logrus.TextFormatter{
				FullTimestamp:   true,
				TimestampFormat: "2006-01-02 15:04:05",
				ForceColors:     true,
			})
		}
		// Setup file rotation and output
		if cfg.IsDevelopment() {
			// In development, log to both file and stdout
			fileWriter := setupFileRotation(cfg)
			multiWriter := io.MultiWriter(os.Stdout, fileWriter)
			logger.SetOutput(multiWriter)
		} else {
			// In production, log only to file
			fileWriter := setupFileRotation(cfg)
			logger.SetOutput(fileWriter)
		}

		instance = &Logger{Logger: logger}
	})
	return instance
}

func Get() *Logger {
	if instance == nil {
		New()
	}
	return instance
}

// setupFileRotation configures file rotation using lumberjack
func setupFileRotation(cfg *config.Config) io.Writer {
	// Ensure logs directory exists
	logDir := cfg.Logging.OutputDir
	if err := os.MkdirAll(logDir, 0755); err != nil {
		if cfg.IsProduction() {
			log.Fatalf(" Cannot create log directory: %v", err)
		} else {
			logrus.WithError(err).Warn("⚠️ Failed to create logs directory")
		}
	}

	return &lumberjack.Logger{
		Filename:   filepath.Join(logDir, "app.log"),
		MaxSize:    cfg.Logging.MaxSize,
		MaxBackups: cfg.Logging.MaxBackups,
		MaxAge:     cfg.Logging.MaxAge,
		Compress:   cfg.Logging.Compress,
	}
}

// WithFields creates a new entry with the given fields
func (l *Logger) WithFields(fields logrus.Fields) *logrus.Entry {
	return l.Logger.WithFields(fields)
}

// WithField creates a new entry with a single field
func (l *Logger) WithField(key string, value interface{}) *logrus.Entry {
	return l.Logger.WithField(key, value)
}

// WithError creates a new entry with an error field
func (l *Logger) WithError(err error) *logrus.Entry {
	return l.Logger.WithError(err)
}

// WithRequest creates a new entry with request information
func (l *Logger) WithHTTP(method, path, ip string, statusCode int, duration int64) *logrus.Entry {
	return l.Logger.WithFields(logrus.Fields{
		"method":   method,
		"path":     path,
		"ip":       ip,
		"status":   statusCode,
		"duration": duration,
	})
}
