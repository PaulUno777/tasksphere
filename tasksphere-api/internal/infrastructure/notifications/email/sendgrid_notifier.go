package email

import (
	"context"
	"fmt"
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/config"
	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// SendGridNotifier implements the Notifier interface using SendGrid
type SendGridNotifier struct {
	client    *sendgrid.Client
	formatter services.MessageFormatter
	fromEmail string
	fromName  string
}

// NewSendGridNotifier creates a new SendGrid notifier
func NewSendGridNotifier(cfg *config.Config, formatter services.MessageFormatter) *SendGridNotifier {
	apiKey := getEnv("SENDGRID_API_KEY", "")
	fromEmail := getEnv("EMAIL_FROM_ADDRESS", "noreply@tasksphere.app")
	fromName := getEnv("EMAIL_FROM_NAME", "TaskSphere")

	return &SendGridNotifier{
		client:    sendgrid.NewSendClient(apiKey),
		formatter: formatter,
		fromEmail: fromEmail,
		fromName:  fromName,
	}
}

// GetChannel returns the email channel
func (n *SendGridNotifier) GetChannel() entities.NotificationChannel {
	return entities.ChannelEmail
}

// Send sends a single email notification
func (n *SendGridNotifier) Send(ctx context.Context, message *entities.NotificationMessage) (*entities.NotificationResult, error) {
	// Format the message
	formatted, err := n.formatter.Format(ctx, message)
	if err != nil {
		return &entities.NotificationResult{
			Success: false,
			Error:   fmt.Errorf("failed to format message: %w", err),
			SentAt:  time.Now(),
		}, err
	}

	// Create SendGrid message
	from := mail.NewEmail(n.fromName, n.fromEmail)
	to := mail.NewEmail(message.RecipientName, message.RecipientEmail)

	sgMessage := mail.NewSingleEmail(from, formatted.Subject, to, "", formatted.Content)

	// Add metadata as custom args
	if message.Metadata != nil {
		for key, value := range message.Metadata {
			sgMessage.SetCustomArg(key, fmt.Sprintf("%v", value))
		}
	}

	// Add notification metadata
	sgMessage.SetCustomArg("notificationType", string(message.Type))
	sgMessage.SetCustomArg("priority", string(message.Priority))
	if !message.RecipientID.IsZero() {
		sgMessage.SetCustomArg("recipientId", message.RecipientID.Hex())
	}

	// Send the email
	response, err := n.client.Send(sgMessage)
	if err != nil {
		return &entities.NotificationResult{
			Success: false,
			Error:   fmt.Errorf("sendgrid send failed: %w", err),
			SentAt:  time.Now(),
			Metadata: map[string]interface{}{
				"statusCode": response.StatusCode,
				"body":       response.Body,
				"headers":    response.Headers,
			},
		}, err
	}

	// Check if the request was successful
	if response.StatusCode >= 200 && response.StatusCode < 300 {
		return &entities.NotificationResult{
			Success: true,
			SentAt:  time.Now(),
			Metadata: map[string]interface{}{
				"statusCode": response.StatusCode,
				"headers":    response.Headers,
			},
		}, nil
	}

	// Request failed
	return &entities.NotificationResult{
		Success: false,
		Error:   fmt.Errorf("sendgrid request failed with status %d: %s", response.StatusCode, response.Body),
		SentAt:  time.Now(),
		Metadata: map[string]interface{}{
			"statusCode": response.StatusCode,
			"body":       response.Body,
			"headers":    response.Headers,
		},
	}, fmt.Errorf("sendgrid request failed with status %d", response.StatusCode)
}

// SendBatch sends multiple email notifications efficiently
func (n *SendGridNotifier) SendBatch(ctx context.Context, messages []*entities.NotificationMessage) (*entities.BatchNotificationResult, error) {
	result := &entities.BatchNotificationResult{
		TotalCount: len(messages),
		Results:    make([]*entities.NotificationResult, 0, len(messages)),
		Metadata:   make(map[string]interface{}),
	}

	// SendGrid supports batch sending, but for simplicity and better error handling,
	// we'll send individually in this implementation
	for _, message := range messages {
		singleResult, err := n.Send(ctx, message)
		result.Results = append(result.Results, singleResult)

		if singleResult.Success {
			result.SuccessCount++
		} else {
			result.FailureCount++
		}

		// If we get rate limited, we might want to add delays
		if err != nil && isRateLimited(err) {
			time.Sleep(100 * time.Millisecond)
		}
	}

	result.Metadata["batchSentAt"] = time.Now()
	return result, nil
}

// IsHealthy checks if SendGrid is operational
func (n *SendGridNotifier) IsHealthy(ctx context.Context) error {
	// Simple health check - try to create a client and validate API key format
	if n.client == nil {
		return fmt.Errorf("sendgrid client not initialized")
	}

	apiKey := getEnv("SENDGRID_API_KEY", "")
	if apiKey == "" {
		return fmt.Errorf("sendgrid API key not configured")
	}

	// Basic API key format validation
	if len(apiKey) < 10 || !startsWithSG(apiKey) {
		return fmt.Errorf("invalid sendgrid API key format")
	}

	return nil
}

func isRateLimited(err error) bool {
	// Check if error indicates rate limiting
	return false // Implement based on SendGrid error patterns
}

func startsWithSG(s string) bool {
	return len(s) >= 2 && s[:2] == "SG"
}

func getEnv(key, defaultValue string) string {
	// This should use the same helper from config package
	return defaultValue
}
