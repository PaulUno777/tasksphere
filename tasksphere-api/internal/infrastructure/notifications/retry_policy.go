package notifications

import (
	"time"

	"github.com/PaulUno777/tasksphere-api/internal/domain/entities"
	"github.com/PaulUno777/tasksphere-api/internal/domain/services"
)

// ExponentialRetryPolicy implements RetryPolicy with exponential backoff
type ExponentialRetryPolicy struct {
	baseDelay  time.Duration
	maxDelay   time.Duration
	multiplier float64
	maxRetries map[entities.Priority]int
}

// NewExponentialRetryPolicy creates a new exponential retry policy
func NewExponentialRetryPolicy() services.RetryPolicy {
	return &ExponentialRetryPolicy{
		baseDelay:  30 * time.Second,
		maxDelay:   1 * time.Hour,
		multiplier: 2.0,
		maxRetries: map[entities.Priority]int{
			entities.PriorityLow:      0, // No retries for low priority
			entities.PriorityNormal:   2,
			entities.PriorityHigh:     5,
			entities.PriorityCritical: 10,
		},
	}
}

// ShouldRetry determines if a notification should be retried
func (p *ExponentialRetryPolicy) ShouldRetry(record *entities.Notification, err error) bool {
	// Don't retry if max retries reached
	if record.RetryCount >= p.GetMaxRetries(record.Priority) {
		return false
	}

	// Don't retry if expired
	if record.ExpiresAt != nil && time.Now().After(*record.ExpiresAt) {
		return false
	}

	// Don't retry for certain error types (permanent failures)
	if isPermanentError(err) {
		return false
	}

	return true
}

// GetRetryDelay returns the delay before next retry using exponential backoff
func (p *ExponentialRetryPolicy) GetRetryDelay(record *entities.Notification) *time.Duration {
	if record.RetryCount == 0 {
		return &p.baseDelay
	}

	// Calculate exponential backoff
	delay := time.Duration(float64(p.baseDelay) * pow(p.multiplier, float64(record.RetryCount)))

	// Cap at max delay
	if delay > p.maxDelay {
		delay = p.maxDelay
	}

	return &delay
}

// GetMaxRetries returns the maximum number of retries for a priority level
func (p *ExponentialRetryPolicy) GetMaxRetries(priority entities.Priority) int {
	if maxRetries, exists := p.maxRetries[priority]; exists {
		return maxRetries
	}
	return 2 // Default
}

// Helper functions
func isPermanentError(err error) bool {
	if err == nil {
		return false
	}

	errorStr := err.Error()

	// Add patterns for permanent failures
	permanentPatterns := []string{
		"invalid email",
		"blocked",
		"unsubscribed",
		"bounced",
		"invalid API key",
	}

	for _, pattern := range permanentPatterns {
		if contains(errorStr, pattern) {
			return true
		}
	}

	return false
}

func pow(base, exp float64) float64 {
	result := 1.0
	for i := 0; i < int(exp); i++ {
		result *= base
	}
	return result
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) &&
		(s == substr || findSubstring(s, substr))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
