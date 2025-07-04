package notifications

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/repositories"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/PaulUno777/tasksphere-api/internal/infrastructure/logger"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type NotificationServiceImpl struct {
	notifiers   map[entities.NotificationChannel]services.Notifier
	formatters  map[entities.NotificationChannel]services.MessageFormatter
	repository  repositories.NotificationRepository
	retryPolicy services.RetryPolicy
	logger      *logger.Logger
	mu          sync.RWMutex
}

// NewNotificationService creates a new notification service
func NewNotificationService(
	repository repositories.NotificationRepository,
	retryPolicy services.RetryPolicy,
) services.NotificationService {
	return &NotificationServiceImpl{
		notifiers:   make(map[entities.NotificationChannel]services.Notifier),
		formatters:  make(map[entities.NotificationChannel]services.MessageFormatter),
		repository:  repository,
		retryPolicy: retryPolicy,
		logger:      logger.Get(),
	}
}

// RegisterNotifier registers a new notification channel
func (s *NotificationServiceImpl) RegisterNotifier(notifier services.Notifier) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	channel := notifier.GetChannel()
	s.notifiers[channel] = notifier

	s.logger.Info("Registered notifier", "channel", channel)
	return nil
}

// RegisterFormatter registers a message formatter
func (s *NotificationServiceImpl) RegisterFormatter(formatter services.MessageFormatter) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	channel := formatter.GetChannel()
	s.formatters[channel] = formatter

	s.logger.Info("Registered formatter", "channel", channel)
	return nil
}

// Send sends a notification through the appropriate channel
func (s *NotificationServiceImpl) Send(ctx context.Context, message *entities.NotificationMessage) (*entities.NotificationResult, error) {
	s.mu.RLock()
	notifier, exists := s.notifiers[message.Channel]
	s.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("no notifier registered for channel: %s", message.Channel)
	}

	// Check if notifier is healthy
	if err := notifier.IsHealthy(ctx); err != nil {
		s.logger.Error("Notifier health check failed", "channel", message.Channel, "error", err)

		// If high/critical priority, persist for retry
		if message.ShouldPersist() {
			record := s.createNotificationRecord(message)
			record.Status = entities.StatusFailed
			record.LastError = fmt.Sprintf("Notifier unhealthy: %v", err)

			if _, saveErr := s.repository.Save(ctx, record); saveErr != nil {
				s.logger.Error("Failed to save notification for retry", "error", saveErr)
			}
		}

		return &entities.NotificationResult{
			Success: false,
			Error:   fmt.Errorf("notifier unhealthy: %w", err),
			SentAt:  time.Now(),
		}, err
	}

	// Attempt to send
	result, err := notifier.Send(ctx, message)

	// Handle result based on priority and success
	if message.ShouldPersist() {
		record := s.createNotificationRecord(message)

		if result.Success {
			record.MarkSent(result.MessageID)
		} else {
			retryDelay := s.retryPolicy.GetRetryDelay(record)
			record.MarkFailed(err, retryDelay)
		}

		if _, saveErr := s.repository.Save(ctx, record); saveErr != nil {
			s.logger.Error("Failed to save notification record", "error", saveErr)
		}
	}

	// Log the result
	if result.Success {
		s.logger.Info("Notification sent successfully",
			"type", message.Type,
			"channel", message.Channel,
			"recipient", message.RecipientEmail,
			"messageId", result.MessageID)
	} else {
		s.logger.Error("Notification failed",
			"type", message.Type,
			"channel", message.Channel,
			"recipient", message.RecipientEmail,
			"error", err)
	}

	return result, err
}

// SendBatch sends multiple notifications
func (s *NotificationServiceImpl) SendBatch(ctx context.Context, messages []*entities.NotificationMessage) (*entities.BatchNotificationResult, error) {
	// Group messages by channel
	channelGroups := make(map[entities.NotificationChannel][]*entities.NotificationMessage)
	for _, message := range messages {
		channelGroups[message.Channel] = append(channelGroups[message.Channel], message)
	}

	totalResult := &entities.BatchNotificationResult{
		TotalCount: len(messages),
		Results:    make([]*entities.NotificationResult, 0, len(messages)),
		Metadata:   make(map[string]interface{}),
	}

	// Send by channel
	for channel, channelMessages := range channelGroups {
		s.mu.RLock()
		notifier, exists := s.notifiers[channel]
		s.mu.RUnlock()

		if !exists {
			// Mark all messages as failed
			for _, _ = range channelMessages {
				result := &entities.NotificationResult{
					Success: false,
					Error:   fmt.Errorf("no notifier registered for channel: %s", channel),
					SentAt:  time.Now(),
				}
				totalResult.Results = append(totalResult.Results, result)
				totalResult.FailureCount++
			}
			continue
		}

		// Send batch for this channel
		batchResult, err := notifier.SendBatch(ctx, channelMessages)
		if err != nil {
			s.logger.Error("Batch send failed", "channel", channel, "error", err)
		}

		// Merge results
		totalResult.Results = append(totalResult.Results, batchResult.Results...)
		totalResult.SuccessCount += batchResult.SuccessCount
		totalResult.FailureCount += batchResult.FailureCount

		// Persist records for high/critical priority messages
		for i, message := range channelMessages {
			if message.ShouldPersist() && i < len(batchResult.Results) {
				record := s.createNotificationRecord(message)
				result := batchResult.Results[i]

				if result.Success {
					record.MarkSent(result.MessageID)
				} else {
					retryDelay := s.retryPolicy.GetRetryDelay(record)
					record.MarkFailed(result.Error, retryDelay)
				}

				if _, saveErr := s.repository.Save(ctx, record); saveErr != nil {
					s.logger.Error("Failed to save notification record", "error", saveErr)
				}
			}
		}
	}

	s.logger.Info("Batch notification completed",
		"total", totalResult.TotalCount,
		"success", totalResult.SuccessCount,
		"failed", totalResult.FailureCount)

	return totalResult, nil
}

// GetAvailableChannels returns available notification channels
func (s *NotificationServiceImpl) GetAvailableChannels() []entities.NotificationChannel {
	s.mu.RLock()
	defer s.mu.RUnlock()

	channels := make([]entities.NotificationChannel, 0, len(s.notifiers))
	for channel := range s.notifiers {
		channels = append(channels, channel)
	}

	return channels
}

// ProcessRetries processes failed notifications for retry
func (s *NotificationServiceImpl) ProcessRetries(ctx context.Context) error {
	s.logger.Info("Starting retry processing")

	// Get pending retries (limit to 100 at a time to avoid memory issues)
	records, err := s.repository.GetPendingRetries(ctx, 100)
	if err != nil {
		return fmt.Errorf("failed to get pending retries: %w", err)
	}

	s.logger.Info("Found notifications to retry", "count", len(records))

	for _, record := range records {
		// Check if we should retry this record
		if !s.retryPolicy.ShouldRetry(record, nil) {
			// Mark as expired or failed permanently
			if record.ExpiresAt != nil && time.Now().After(*record.ExpiresAt) {
				record.MarkExpired()
			} else {
				record.Status = entities.StatusFailed
				record.UpdateTimestamp()
			}

			s.repository.Update(ctx, record)
			continue
		}

		// Check if it's time to retry
		if record.ScheduledAt != nil && time.Now().Before(*record.ScheduledAt) {
			continue
		}

		// Mark as retrying
		record.MarkRetrying()
		if err := s.repository.Update(ctx, record); err != nil {
			s.logger.Error("Failed to update retry status", "recordId", record.GetID(), "error", err)
			continue
		}

		// Convert to message and retry
		message := s.recordToMessage(record)
		result, _ := s.Send(ctx, message)

		// The Send method will update the record status, so we don't need to do it here
		s.logger.Info("Retry attempt completed",
			"recordId", record.GetID(),
			"success", result.Success,
			"retryCount", record.RetryCount)
	}

	s.logger.Info("Retry processing completed")
	return nil
}

// CleanupExpired removes expired notification records
func (s *NotificationServiceImpl) CleanupExpired(ctx context.Context) error {
	s.logger.Info("Starting expired notification cleanup")

	// Get expired records (older than 30 days)
	cutoff := time.Now().AddDate(0, 0, -30)
	expired, err := s.repository.GetExpired(ctx, cutoff, 1000)
	if err != nil {
		return fmt.Errorf("failed to get expired notifications: %w", err)
	}

	if len(expired) == 0 {
		s.logger.Info("No expired notifications to clean up")
		return nil
	}

	// Extract IDs for deletion
	ids := make([]bson.ObjectID, len(expired))
	for i, record := range expired {
		ids[i] = record.ID
	}

	// Delete expired records
	if err := s.repository.Delete(ctx, ids); err != nil {
		return fmt.Errorf("failed to delete expired notifications: %w", err)
	}

	s.logger.Info("Expired notification cleanup completed", "deletedCount", len(ids))
	return nil
}

// Helper methods
func (s *NotificationServiceImpl) createNotificationRecord(message *entities.NotificationMessage) *entities.Notification {
	record := &entities.Notification{
		Base:           entities.NewBase(),
		Type:           message.Type,
		Channel:        message.Channel,
		Priority:       message.Priority,
		Status:         entities.StatusPending,
		RecipientID:    message.RecipientID,
		RecipientEmail: message.RecipientEmail,
		Subject:        message.Subject,
		Content:        message.Content,
		Data:           message.Data,
		ScheduledAt:    message.ScheduledAt,
		ExpiresAt:      message.ExpiresAt,
		RetryCount:     0,
		MaxRetries:     s.retryPolicy.GetMaxRetries(message.Priority),
		Metadata:       message.Metadata,
	}

	// Set expiration if not provided
	if record.ExpiresAt == nil {
		expiry := message.GetExpirationTime()
		record.ExpiresAt = &expiry
	}

	return record
}

func (s *NotificationServiceImpl) recordToMessage(record *entities.Notification) *entities.NotificationMessage {
	return &entities.NotificationMessage{
		Type:           record.Type,
		Channel:        record.Channel,
		Priority:       record.Priority,
		RecipientID:    record.RecipientID,
		RecipientEmail: record.RecipientEmail,
		RecipientName:  record.RecipientEmail, // Use email as fallback
		Subject:        record.Subject,
		Content:        record.Content,
		Data:           record.Data,
		ScheduledAt:    record.ScheduledAt,
		ExpiresAt:      record.ExpiresAt,
		Metadata:       record.Metadata,
	}
}
